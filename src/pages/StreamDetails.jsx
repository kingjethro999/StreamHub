"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Sparkles, MessageCircle, X } from "lucide-react"
import { getStream, getVideoSummary } from "../lib/api"
import { ShortPlayer } from "../components/short-player"

export default function StreamDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // AI summary state
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

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

  const fetchSummary = async () => {
    if (!stream) return
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const data = await getVideoSummary(stream.id)
      setSummary(data)
      setShowSummary(true)
    } catch (err) {
      setSummaryError(err.message)
      setShowSummary(true)
    } finally {
      setSummaryLoading(false)
    }
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

  const aiUnavailable =
    summaryError &&
    (summaryError.includes("not configured") ||
      summaryError.includes("AI features") ||
      summaryError.includes("503"))

  return (
    <div className="h-full w-full bg-black relative">
      <ShortPlayer stream={stream} active onBack={goBack} />

      {/* AI summary button overlay (top right) */}
      <button
        type="button"
        onClick={fetchSummary}
        disabled={summaryLoading}
        aria-label={summaryLoading ? "Generating AI summary…" : "Summarise this video with AI"}
        className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {summaryLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Sparkles size={16} />
        )}
        {summaryLoading ? "Summarising…" : "AI Summary"}
      </button>

      {/* AI summary modal */}
      {showSummary && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSummary(false)
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl border-t border-black/10 shadow-2xl p-5 mb-4 animate-in slide-in-from-bottom duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                AI video summary
              </h3>
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            {summaryLoading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
                <p className="text-sm text-gray-500">Generating summary…</p>
              </div>
            ) : summaryError ? (
              <div className="py-4">
                <div className="flex items-start gap-2 mb-3">
                  <MessageCircle size={16} className="text-amber-500 mt-0.5" />
                  <p className="text-sm text-gray-900 leading-relaxed">
                    Couldn&apos;t generate an AI summary at the moment.
                  </p>
                </div>
                {aiUnavailable ? (
                  <p className="text-xs text-gray-500 mb-3">
                    AI features need a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">NVIDIA_API_KEY</code>
                    set on the server. Core playback still works without it.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">
                    {String(summaryError).slice(0, 200)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={fetchSummary}
                  className="w-full rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {summary?.summary ?? "No summary available."}
                </p>
                {summary?.suggested_title && summary.suggested_title !== stream.title && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Suggested title</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {summary.suggested_title}
                    </p>
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  Model: {summary?.model ?? "NVIDIA"} ·
                  Grounded in video content
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
