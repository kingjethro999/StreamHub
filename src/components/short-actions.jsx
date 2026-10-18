"use client"

import { ThumbsUp, MessageSquare, Share2, Repeat2 } from "lucide-react"
import { formatCount } from "../lib/utils"

function Action({ icon: Icon, label, active, spinning, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex flex-col items-center gap-1.5 outline-none"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur-md transition group-hover:bg-black/70 group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-white/70">
        <Icon
          size={22}
          className={`text-white ${spinning ? "animate-spin" : ""}`}
          fill={active ? "currentColor" : "none"}
          strokeWidth={active ? 0 : 2}
        />
      </span>
      <span className="text-[11px] font-semibold text-white drop-shadow-md">{label}</span>
    </button>
  )
}

/**
 * YouTube-Shorts-style action rail that sits over the right edge of the video.
 * Every action is wired to a real API call by the parent.
 */
export function ShortActions({
  liked,
  likeCount,
  commentCount,
  remixing,
  onLike,
  onComments,
  onShare,
  onRemix,
}) {
  return (
    <div className="absolute bottom-24 right-1.5 z-20 flex flex-col items-center gap-4 sm:right-3 sm:gap-5">
      <Action
        icon={ThumbsUp}
        label={formatCount(likeCount)}
        active={liked}
        onClick={onLike}
      />
      <Action
        icon={MessageSquare}
        label={formatCount(commentCount)}
        onClick={onComments}
      />
      <Action icon={Share2} label="Share" onClick={onShare} />
      <Action icon={Repeat2} label="Remix" spinning={remixing} onClick={onRemix} />
    </div>
  )
}
