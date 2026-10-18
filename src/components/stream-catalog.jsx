"use client"

import { useEffect, useState } from "react"
import { listStreams } from "../lib/api"
import { StreamCard } from "./stream-card"
import { CategoryFilter } from "./category-filter"

export function StreamCatalog() {
  const [streams, setStreams] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchStreams = async () => {
      setLoading(true)
      try {
        const data = await listStreams({
          status: "live",
          category: selectedCategory,
          order: "viewers_count",
          dir: "desc",
        })
        if (!cancelled) setStreams(data || [])
      } catch (error) {
        console.error("Error fetching streams:", error)
        if (!cancelled) setStreams([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStreams()
    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🔥</span>
          <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
        </div>

        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading streams...</p>
        </div>
      ) : streams.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <img
            src="/workspace-desk-setup-streaming.jpg"
            alt="No live streams illustration"
            className="w-64 max-w-full mb-8 rounded-lg opacity-80 mix-blend-luminosity"
          />
          <p className="text-muted-foreground">No live streams at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  )
}
