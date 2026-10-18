import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** 12400 -> "12.4K", 1500000 -> "1.5M" */
export function formatCount(value) {
  const n = Number(value) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return String(n)
}

/** "2026-03-01T..." -> "7 months ago" */
export function timeAgo(value) {
  if (!value) return ""
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ""
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000))
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [name, size] of units) {
    const n = Math.floor(seconds / size)
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`
  }
  return "just now"
}
