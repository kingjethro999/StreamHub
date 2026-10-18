"use client"

import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  getCurrentUser,
  getLikeState,
  likeStream,
  unlikeStream,
  repostStream,
  isFollowing,
  followChannel,
  unfollowChannel,
  recordStreamView,
} from "../lib/api"
import { ShortActions } from "./short-actions"
import { CommentsPanel } from "./comments-panel"
import { ShareModal } from "./share-modal"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Volume2, VolumeX, Play, Pause, ArrowLeft } from "lucide-react"
import { timeAgo } from "../lib/utils"

/**
 * A single full-height, snap-scrollable short. Shared by the Home swipe feed
 * and the standalone /stream/:id page.
 */
export function ShortPlayer({ stream, active = true, onBack, preload }) {
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const viewedRef = useRef(false)
  const preloadedRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [showPlayIcon, setShowPlayIcon] = useState(false)
  const [duration, setDuration] = useState(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(stream.likes_count || 0)
  const [commentCount, setCommentCount] = useState(stream.comments_count || 0)
  const [busy, setBusy] = useState(false)
  const [remixing, setRemixing] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [following, setFollowing] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const channel = stream.channel || {}
  const handle = channel.handle ? channel.handle.replace(/^@/, "") : "user"
  const videoSrc = stream.video_url || stream.thumbnail_url
  const isVideo = Boolean(videoSrc) && /\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i.test(videoSrc)

  // Play only while this short is the one on screen; record one view per
  // short the first time it becomes visible. Preload items only buffer
  // metadata so they start instantly when they become active.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted

    if (preload) {
      if (!preloadedRef.current) {
        preloadedRef.current = true
        video.preload = "auto"
        video.load()
      }
      return
    }

    preloadedRef.current = false
    if (active) {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      if (!viewedRef.current) {
        viewedRef.current = true
        recordStreamView(stream.id).catch(() => {})
      }
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [active, stream.id, preload, muted])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const user = await getCurrentUser()
        if (!user) return
        const [{ liked: isLiked }, followState] = await Promise.all([
          getLikeState(stream.id).catch(() => ({ liked: false })),
          channel.id ? isFollowing(channel.id).catch(() => ({ following: false })) : { following: false },
        ])
        if (!alive) return
        if (isLiked) setLiked(true)
        if (followState?.following) setFollowing(true)
      } catch {
        /* not signed in */
      }
    })()
    return () => {
      alive = false
    }
  }, [stream.id, channel.id])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || !isVideo) return
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      video.pause()
      setPlaying(false)
    }
    setShowPlayIcon(true)
    window.setTimeout(() => setShowPlayIcon(false), 450)
  }

  const handleSeek = (event) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    video.currentTime = ratio * video.duration
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !progressRef.current || !video.duration) return
    progressRef.current.style.width = `${(video.currentTime / video.duration) * 100}%`
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video && video.duration) setDuration(video.duration)
  }

  const handleLike = async () => {
    if (busy) return
    setBusy(true)
    try {
      const user = await getCurrentUser()
      if (!user) return
      if (liked) {
        const res = await unlikeStream(stream.id)
        setLiked(false)
        setLikeCount(typeof res?.likes_count === "number" ? res.likes_count : Math.max(0, likeCount - 1))
      } else {
        const res = await likeStream(stream.id)
        setLiked(true)
        setLikeCount(typeof res?.likes_count === "number" ? res.likes_count : likeCount + 1)
      }
    } catch (err) {
      console.error("Like failed:", err)
    } finally {
      setBusy(false)
    }
  }

  const handleSubscribe = async () => {
    if (!channel.id || subscribing) return
    setSubscribing(true)
    try {
      const user = await getCurrentUser()
      if (!user) return
      if (following) {
        await unfollowChannel(channel.id)
        setFollowing(false)
      } else {
        await followChannel(channel.id)
        setFollowing(true)
      }
    } catch (err) {
      console.error("Follow failed:", err)
    } finally {
      setSubscribing(false)
    }
  }

  const handleRemix = async () => {
    if (remixing) return
    setRemixing(true)
    try {
      const user = await getCurrentUser()
      if (!user) return
      await repostStream(stream.id)
    } catch (err) {
      console.error("Remix failed:", err)
    } finally {
      setRemixing(false)
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      {/* 9:16 column – full-bleed on phones, a centred portrait card on desktop */}
      <div className="relative h-full w-full overflow-hidden bg-black md:h-full md:w-auto md:max-w-full md:aspect-[9/16] md:rounded-xl">
        {isVideo ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={stream.thumbnail_url || undefined}
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted={muted}
            playsInline
            preload={preload ? "auto" : "metadata"}
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          <img
            src={stream.thumbnail_url || "/placeholder.svg?height=1920&width=1080"}
            alt={stream.title}
            className="absolute inset-0 h-full w-full object-cover"
            onClick={togglePlay}
          />
        )}

        {/* Tap-to-pause feedback */}
        {showPlayIcon && isVideo && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/50 backdrop-blur-sm">
              {playing ? (
                <Pause size={30} className="text-white" fill="currentColor" />
              ) : (
                <Play size={30} className="text-white" fill="currentColor" />
              )}
            </span>
          </div>
        )}

        {/* Top bar: back button + mute toggle + audio state */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/70"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <span />
          )}
          {isVideo && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/70"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <span
                className={`text-[10px] font-semibold ${
                  muted ? "text-white/50" : "text-emerald-400"
                }`}
              >
                {muted ? "Audio off" : "Audio on"}
              </span>
            </div>
          )}
        </div>

        {/* Bottom scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <ShortActions
          liked={liked}
          likeCount={likeCount}
          commentCount={commentCount}
          remixing={remixing}
          onLike={handleLike}
          onComments={() => setShowComments(true)}
          onShare={() => setShowShare(true)}
          onRemix={handleRemix}
        />

        {/* Channel + title info */}
        <div className="absolute inset-x-0 bottom-4 z-20 px-3 sm:px-4">
          <div className="mb-3 flex items-center gap-2.5">
            <Link to={channel.id ? `/channel/${channel.id}` : "#"} className="shrink-0">
              <Avatar className="h-9 w-9 ring-2 ring-white/80">
                <AvatarImage src={channel.avatar_url || ""} alt={channel.name || handle} />
                <AvatarFallback className="bg-zinc-800 text-xs text-white">
                  {(channel.name || handle).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link
              to={channel.id ? `/channel/${channel.id}` : "#"}
              className="truncate text-sm font-semibold text-white drop-shadow hover:underline"
            >
              @{handle}
            </Link>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing}
              aria-label={following ? "Unsubscribe" : "Subscribe"}
              className={`ml-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                following
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-white text-black hover:bg-white/90"
              } ${subscribing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {subscribing ? "…" : following ? "Subscribed" : "Subscribe"}
            </button>
          </div>

          <h2 className="line-clamp-2 max-w-full pr-16 text-sm font-medium text-white drop-shadow">
            {stream.title}
          </h2>
          {stream.description && (
            <p className="mt-1 line-clamp-2 pr-16 text-xs text-white/75">{stream.description}</p>
          )}
          <p className="mt-1.5 text-[11px] text-white/60">
            {stream.views_count ? `${(stream.views_count).toLocaleString()} views` : "New"}
            {duration && ` · ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`}
            {stream.created_at ? ` · ${timeAgo(stream.created_at)}` : ""}
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 h-[3px] cursor-pointer bg-white/20"
          onClick={handleSeek}
        >
          <div ref={progressRef} className="h-full w-0 bg-white transition-[width] duration-150" />
        </div>

        <CommentsPanel
          streamId={stream.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount((c) => c + 1)}
        />
        <ShareModal streamId={stream.id} isOpen={showShare} onClose={() => setShowShare(false)} />
      </div>
    </div>
  )
}
