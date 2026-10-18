"use client"

import { Link } from "react-router-dom"
import { Play, Eye } from "lucide-react"
import { formatCount, timeAgo } from "../lib/utils"

/**
 * Vertical 9:16 "short" card used in the Search and channel grids.
 */
export function StreamCard({ stream }) {
  const channel = stream.channel ?? {}
  const handle = channel.handle ? channel.handle.replace(/^@/, "") : channel.name || "user"

  return (
    <Link to={`/stream/${stream.id}`} className="group block">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
        <img
          src={stream.thumbnail_url || "/placeholder.svg?height=1280&width=720&query=short-video"}
          alt={stream.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Hover play affordance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-black/50 backdrop-blur-sm">
            <Play size={22} className="text-white" fill="currentColor" />
          </span>
        </div>

        {stream.status === "live" && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Live
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug drop-shadow">
            {stream.title}
          </p>
          <p className="mt-1 truncate text-[11px] text-white/80">@{handle}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
            <Eye size={11} />
            {formatCount(stream.views_count ?? 0)}
            {stream.created_at ? <span>· {timeAgo(stream.created_at)}</span> : null}
          </p>
        </div>
      </div>
    </Link>
  )
}
