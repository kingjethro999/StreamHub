"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { createClient } from "../lib/supabase/client"
import { StreamCard } from "../components/stream-card"
import { X } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { ExternalLink, Mail } from "lucide-react"

export default function ChannelDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(null)
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChannelData = async () => {
      const supabase = createClient()

      try {
        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("*")
          .eq("id", id)
          .single()

        if (channelError) throw channelError
        setChannel(channelData)

        const { data: streamsData, error: streamsError } = await supabase
          .from("streams")
          .select("*, channel:channels(*)")
          .eq("channel_id", id)
          .order("created_at", { ascending: false })

        if (streamsError) throw streamsError
        setStreams(streamsData || [])
      } catch (error) {
        console.error("Error fetching channel data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChannelData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading channel...</p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Channel not found</p>
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

      <div className="max-w-6xl mx-auto pb-12">
        {/* Channel Header */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Banner */}
          <div className="w-full aspect-[16/4] bg-muted relative">
            {channel.banner_url ? (
              <img src={channel.banner_url} alt="Channel Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-muted-foreground opacity-50 font-bold tracking-widest uppercase">StreamHub Creator</span>
              </div>
            )}
          </div>

          {/* Profile Info Container */}
          <div className="px-6 pb-6 lg:px-10 lg:pb-10 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 mb-6">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-xl">
                <AvatarImage src={channel.avatar_url || "/placeholder.svg"} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {channel.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left pt-16 md:pt-0">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{channel.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3 text-muted-foreground">
                  {channel.handle && <span className="font-medium text-foreground">{channel.handle}</span>}
                  {channel.handle && <span>•</span>}
                  <span>{channel.followers_count?.toLocaleString()} subscribers</span>
                  <span>•</span>
                  <span>{streams.length} videos</span>
                </div>
                <p className="text-foreground/90 max-w-3xl text-sm md:text-base mb-4 text-balance line-clamp-3">
                  {channel.description || "Welcome to my channel!"}
                </p>

                {/* Links & Contact */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  {channel.contact_email && (
                    <a href={`mailto:${channel.contact_email}`} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                      <Mail size={16} /> Contact
                    </a>
                  )}
                  {channel.links && channel.links.length > 0 && channel.links.map((link, idx) => (
                    link.url && link.title ? (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        <ExternalLink size={16} /> {link.title}
                      </a>
                    ) : null
                  ))}
                </div>
              </div>

              <div className="w-full md:w-auto mt-4 md:mt-0">
                <Button size="lg" className="w-full md:w-auto rounded-full font-bold px-8 shadow-md hover:scale-105 transition-transform">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Streams */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Streams</h2>
          {streams.length === 0 ? (
            <Card className="p-8 text-center flex flex-col items-center justify-center">
              <img
                src="/workspace-desk-setup-streaming.jpg"
                alt="No streams available"
                className="w-48 max-w-full mb-6 rounded-lg opacity-80 mix-blend-luminosity"
              />
              <p className="text-muted-foreground">No streams available yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
