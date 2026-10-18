"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { listStreams } from "../lib/api"
import { ShortPlayer } from "./short-player"

/**
 * Full-screen vertical feed of shorts (the Home page). One short is active at
 * a time based on how much of it is visible; only the active one plays.
 *
 * Polished with:
 *   - Touch/swipe gestures to jump to the next or previous short
 *   - Preloading of the upcoming short's video for instant playback
 */
export function SwipeFeed() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)

  const touchStartRef = useRef({ y: 0, x: 0, t: 0 })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await listStreams({ order: "created_at", dir: "desc", limit: 100 })
        if (cancelled) return
        const list = data || []
        setStreams(list)
        setActiveId(list[0]?.id ?? null)
      } catch (error) {
        console.error("Error fetching streams:", error)
        if (!cancelled) setStreams([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const activeIndex = useCallback(
    (id) => streams.findIndex((s) => s.id === id),
    [streams],
  )

  /** Jump to the short at `targetIndex`, clamping to valid range. */
  const jumpTo = useCallback(
    (targetIndex) => {
      if (streams.length === 0) return
      const next = Math.min(Math.max(targetIndex, 0), streams.length - 1)
      const el = document.getElementById(`short-${streams[next].id}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
      setActiveId(streams[next].id)
    },
    [streams],
  )

  /** Handle vertical swipe gestures on the scroll container. */
  const onTouchStart = useCallback(
    (e) => {
      const touch = e.touches?.[0] || e
      touchStartRef.current = { y: touch.clientY, x: touch.clientX, t: Date.now() }
    },
    [],
  )

  const onTouchEnd = useCallback(
    (e) => {
      const touch = e.changedTouches?.[0] || e
      const dy = touch.clientY - touchStartRef.current.y
      const dx = Math.abs(touch.clientX - touchStartRef.current.x)
      const dt = Date.now() - touchStartRef.current.t
      // Only treat as a swipe if it was quick, mostly vertical, and meaningful.
      if (dt > 400 || Math.abs(dy) < 60 || dx > Math.abs(dy)) return

      const idx = activeIndex(activeId)
      if (dy < 0) {
        // Swiped up → next short
        jumpTo(idx + 1)
      } else {
        // Swiped down → previous short
        jumpTo(idx - 1)
      }
    },
    [activeId, activeIndex, jumpTo],
  )

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm font-medium text-white/60">Loading shorts...</p>
      </div>
    )
  }

  if (streams.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
        <p className="text-lg font-semibold text-white">No shorts yet</p>
        <p className="max-w-sm text-sm text-white/60">
          Nothing has been posted here yet. Upload a short to get the feed started.
        </p>
      </div>
    )
  }

  // Preload the short immediately after the active one so it plays instantly.
  const activeIdx = activeIndex(activeId)
  const preloadId = activeIdx >= 0 ? streams[activeIdx + 1]?.id : null

  return (
    <div className="relative h-full w-full bg-black">
      {/* Shorts wordmark */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 select-none">
        <span className="text-sm font-bold tracking-tight text-white drop-shadow-md">Shorts</span>
      </div>

      <div
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden overscroll-y-contain"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {streams.map((stream) => {
          const isActive = stream.id === activeId
          const isPreload = stream.id === preloadId
          return (
            <FeedItem
              key={stream.id}
              stream={stream}
              active={isActive}
              preload={isPreload && !isActive}
              onActive={setActiveId}
            />
          )
        })}
      </div>
    </div>
  )
}

function FeedItem({ stream, active, preload, onActive }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          onActive(stream.id)
        }
      },
      { threshold: [0.6] },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onActive, stream.id])

  return (
    <section
      ref={ref}
      id={`short-${stream.id}`}
      className="h-full w-full snap-start snap-always"
    >
      <ShortPlayer stream={stream} active={active} preload={preload} />
    </section>
  )
}
