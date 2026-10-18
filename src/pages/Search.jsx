"use client"

import { useState, useEffect } from "react"
import { StreamCard } from "../components/stream-card"
import { listStreams } from "../lib/api"
import { Search as SearchIcon, X } from "lucide-react"
import { Input } from "../components/ui/input"
import { useNavigate } from "react-router-dom"

const TRENDING_LIMIT = 24

export default function Search() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const trimmed = searchQuery.trim()

    const run = async () => {
      setLoading(true)
      try {
        const data = trimmed
          ? await listStreams({ q: trimmed, order: "created_at", dir: "desc", limit: 60 })
          : await listStreams({ order: "views_count", dir: "desc", limit: TRENDING_LIMIT })
        if (!cancelled) setStreams(data || [])
      } catch (error) {
        console.error("Error searching streams:", error)
        if (!cancelled) setStreams([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timeoutId = setTimeout(run, 250)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [searchQuery])

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 w-full h-full md:px-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/")}
          title="Exit"
          className="p-2 rounded-lg bg-card border border-border hover:border-destructive hover:text-destructive transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6 text-balance">Discover</h1>

        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search shorts, creators, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>
      </div>

      {!isSearching && (
        <h2 className="max-w-7xl mx-auto mb-4 text-xl font-bold">Trending now</h2>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            {isSearching ? "Searching the hub..." : "Loading shorts..."}
          </p>
        </div>
      ) : streams.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <img
            src="/workspace-desk-setup-streaming.jpg"
            alt="Empty search results"
            className="w-64 max-w-full mb-8 rounded-lg opacity-80 mix-blend-luminosity"
          />
          <h2 className="text-2xl font-bold mb-2">No results found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            We couldn&apos;t find any shorts matching &ldquo;{searchQuery}&rdquo;. Try different keywords.
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-12 md:gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  )
}
