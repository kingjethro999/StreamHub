"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { createClient } from "../lib/supabase/client"
import { Eye, Heart, Share2, X } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"

export default function StreamDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStream = async () => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from("streams")
          .select(`
            *,
            channel:channels(*)
          `)
          .eq("id", id)
          .single()

        if (error) throw error
        setStream(data)
      } catch (error) {
        console.error("Error fetching stream:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStream()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading stream...</p>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Stream not found</p>
      </div>
    )
  }

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

        <div className="max-w-6xl mx-auto">
          {/* Video Player */}
          <div className="mb-6 overflow-hidden rounded-xl border border-border shadow-2xl bg-black relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none z-10" />
            {stream.video_url ? (
              <video
                src={stream.video_url}
                poster={stream.thumbnail_url}
                controls
                autoPlay
                className="w-full max-h-[75vh] object-contain aspect-video"
              />
            ) : (
              <div className="relative aspect-video w-full flex items-center justify-center">
                <img
                  src={stream.thumbnail_url || "/placeholder.svg?height=720&width=1280"}
                  alt={stream.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <p className="text-white text-lg font-bold">Video Source Unavailable</p>
                </div>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-4 left-4 z-20">
              {stream.status === 'live' && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-lg border-0">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  LIVE
                </Badge>
              )}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-20 shadow-lg transition-transform hover:scale-105">
              <Eye size={16} className="text-primary" />
              <span className="font-bold text-sm text-white">{stream.viewers_count?.toLocaleString()} watching</span>
            </div>
          </div>

          {/* Stream Info & Actions layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* Main Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-balance leading-tight">{stream.title}</h1>
                <p className="text-sm text-muted-foreground">Streamed on {new Date(stream.created_at).toLocaleDateString()}</p>
              </div>

              {/* Channel Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 cursor-pointer border-2 border-primary/20 hover:border-primary transition-colors" onClick={() => navigate(`/channel/${stream.channel.id}`)}>
                    <AvatarImage src={stream.channel.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {stream.channel.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3
                      className="font-bold text-lg cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/channel/${stream.channel.id}`)}
                    >
                      {stream.channel.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {stream.channel.followers_count?.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button className="rounded-full shadow-md font-bold px-6">Follow</Button>
              </div>

              {/* Description box */}
              <Card className="p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  {stream.channel.category && <Badge variant="secondary">{stream.channel.category}</Badge>}
                  <Badge variant="outline" className="opacity-70">Stream</Badge>
                </div>
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {stream.description || "No description provided for this stream."}
                </p>
              </Card>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-4">
              <Card className="p-4 border border-border shadow-sm sticky top-6">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Interact</h3>
                <div className="flex flex-col gap-3">
                  <Button variant="secondary" className="w-full justify-start font-semibold hover:bg-primary/10 hover:text-primary transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center mr-3 group-hover:bg-primary/20">
                      <Heart size={16} className="text-foreground group-hover:text-primary" />
                    </div>
                    Like Stream
                  </Button>
                  <Button variant="secondary" className="w-full justify-start font-semibold hover:bg-primary/10 hover:text-primary transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center mr-3 group-hover:bg-primary/20">
                      <Share2 size={16} className="text-foreground group-hover:text-primary" />
                    </div>
                    Share View
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
