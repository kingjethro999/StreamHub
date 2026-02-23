"use client"

import { useEffect, useState } from "react"
import { createClient } from "../lib/supabase/client"
import { StreamCard } from "./stream-card"
import { CategoryFilter } from "./category-filter"

export function StreamCatalog() {
  const [streams, setStreams] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreams = async () => {
      const supabase = createClient()

      try {
        let query = supabase
          .from("streams")
          .select(`
            *,
            channel:channels(*)
          `)
          .eq("status", "live")
          .order("viewers_count", { ascending: false })

        if (selectedCategory !== "all") {
          query = query.eq("channel.category", selectedCategory)
        }

        const { data, error } = await query

        if (error) throw error
        setStreams(data || [])
      } catch (error) {
        console.error("Error fetching streams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStreams()
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
        <div className="text-center py-12">
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
