"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getStream } from "../lib/api"
import { ShortPlayer } from "../components/short-player"

export default function StreamDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getStream(id)
      .then((data) => {
        if (!cancelled) setStream(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/")
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <p className="text-lg font-semibold text-white">This short is unavailable</p>
        <p className="max-w-sm text-sm text-white/60">
          It may have been removed, or the link is broken.
        </p>
        <button
          type="button"
          onClick={goBack}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-black">
      <ShortPlayer stream={stream} active onBack={goBack} />
    </div>
  )
}
