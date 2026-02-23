"use client"

import Link from "next/link"
import { Eye } from "lucide-react"

export function StreamCard({ stream }) {
  const channel = stream.channel
  const viewerCount = stream.viewers_count

  const formatViewers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Link href={`/stream/${stream.id}`}>
      <div className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group h-full">
        {/* Thumbnail Container */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={stream.thumbnail_url || "/placeholder.svg?height=225&width=400&query=stream-thumbnail"}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Live Badge */}
          {stream.status === "live" && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full font-bold text-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>
          )}

          {/* View Count */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
            <Eye size={16} />
            <span>{formatViewers(viewerCount)}</span>
          </div>
        </div>

        {/* Stream Info */}
        <div className="p-4">
          <h3 className="font-bold text-base text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {stream.title}
          </h3>

          {/* Channel Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
              {channel.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{channel.name}</p>
              <p className="text-xs text-muted-foreground">{channel.category}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
