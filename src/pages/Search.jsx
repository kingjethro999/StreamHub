"use client"

import { useState, useEffect } from "react"
import { StreamCard } from "../components/stream-card"
import { createClient } from "../lib/supabase/client"
import { SearchIcon, X } from "lucide-react"
import { Input } from "../components/ui/input"
import { useNavigate } from "react-router-dom"

export default function Search() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchStreams = async () => {
      if (!searchQuery.trim()) {
        setStreams([])
        return
      }

      setLoading(true)
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from("streams")
          .select(`
            *,
            channel:channels(*)
          `)
          .eq("status", "live")
          .ilike("title", `%${searchQuery}%`)

        if (error) throw error
        setStreams(data || [])
      } catch (error) {
        console.error("Error searching streams:", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchStreams, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 w-full h-full">
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
          <h1 className="text-3xl font-bold mb-6 text-balance">Search Streams</h1>

          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search for streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Searching the hub...</p>
          </div>
        ) : searchQuery && streams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="text-muted-foreground opacity-50" size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any streams matching "{searchQuery}". Try different keywords.
            </p>
          </div>
        ) : streams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="text-primary opacity-80" size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Discover Content</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start typing to search for live programming, gaming streams, and more.
            </p>
          </div>
        )}
      </div>
  )
}
