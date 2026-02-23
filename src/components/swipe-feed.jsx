"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "../lib/supabase/client"
import { Eye, Heart, Share2, MessageCircle, Repeat2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { CommentsPanel } from "./comments-panel"
import { ShareModal } from "./share-modal"

export function SwipeFeed() {
    const [streams, setStreams] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStreams = async () => {
            const supabase = createClient()
            try {
                const { data, error } = await supabase
                    .from("streams")
                    .select(`
            *,
            channel:channels(*)
          `)
                    .eq("status", "live")
                    .order("created_at", { ascending: false })

                if (error) throw error
                setStreams(data || [])
            } catch (error) {
                console.error("Error fetching streams:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStreams()
    }, [])

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-medium">Loading feed...</p>
                </div>
            </div>
        )
    }

    if (streams.length === 0) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background px-4 text-center">
                <img
                    src="/workspace-desk-setup-streaming.jpg"
                    alt="No streams available"
                    className="w-64 max-w-full mb-8 rounded-lg opacity-80 mix-blend-luminosity"
                />
                <p className="text-muted-foreground">No streams available. Be the first to upload!</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden relative bg-black">
            {streams.map((stream) => (
                <SwipeFeedItem key={stream.id} stream={stream} />
            ))}
        </div>
    )
}

function SwipeFeedItem({ stream }) {
    const videoRef = useRef(null)
    const containerRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [liked, setLiked] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [showShare, setShowShare] = useState(false)
    const [isRemixing, setIsRemixing] = useState(false)

    const channel = stream.channel || {}

    // Try to use video_url or assume thumbnail_url might hold video if uploaded wrongly without the column
    const videoSrc = stream.video_url || stream.thumbnail_url

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: "0px",
            threshold: 0.6, // Play when 60% visible
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (videoRef.current) {
                        videoRef.current.play().catch(() => {
                            // Browser may block autoplay without user interaction
                            setIsPlaying(false)
                        })
                        setIsPlaying(true)
                    }
                } else {
                    if (videoRef.current) {
                        videoRef.current.pause()
                        setIsPlaying(false)
                    }
                }
            })
        }, options)

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [])

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
                setIsPlaying(false)
            } else {
                videoRef.current.play().catch(err => console.error("Play failed:", err))
                setIsPlaying(true)
            }
        }
    }

    const handleLike = (e) => {
        e.stopPropagation()
        setLiked(!liked)
    }

    const handleRemix = async (e) => {
        e.stopPropagation()
        if (isRemixing) return

        setIsRemixing(true)
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert("Log in to remix content!")
                setIsRemixing(false)
                return
            }

            const { error } = await supabase.from("reposts").insert({
                stream_id: stream.id,
                user_id: user.id
            })

            if (error) {
                if (error.code === '42P01') {
                    alert("Run db.sql to create reposts table!")
                } else throw error
            } else {
                alert("Successfully remixed and saved to your profile!")
                // This would ideally open a modal for custom captions, keeping basic for now.
            }
        } catch (err) {
            console.error("Remix failed:", err)
        } finally {
            setIsRemixing(false)
        }
    }

    const formatViewers = (count = 0) => {
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
        return count.toString()
    }

    const isCloudinaryVideo = videoSrc && (videoSrc.includes("cloudinary.com") || videoSrc.match(/\.(mp4|webm|ogg)$/i) !== null)

    return (
        <div
            ref={containerRef}
            className="w-full h-full snap-start snap-always relative bg-black flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
        >
            {/* Video element */}
            {isCloudinaryVideo ? (
                <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    poster={stream.thumbnail_url}
                />
            ) : (
                <div className="relative w-full h-full">
                    <img
                        src={stream.thumbnail_url || "/placeholder.svg?height=1920&width=1080"}
                        alt={stream.title}
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium">Image/Thumbnail</span>
                    </div>
                </div>
            )}

            {/* Play/Pause indicator overlay */}
            {!isPlaying && isCloudinaryVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-0">
                    <svg className="w-16 h-16 text-white/70 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            {/* Overlay - Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10" onClick={(e) => e.stopPropagation()}>
                <div className="relative group cursor-pointer hover:scale-105 transition-transform mb-2">
                    <Avatar className="h-12 w-12 border-2 border-white/80 bg-zinc-900 shadow-lg">
                        <AvatarImage src={channel.avatar_url || ""} />
                        <AvatarFallback className="text-white bg-zinc-800">{channel.name ? channel.name.charAt(0) : "U"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-transparent">
                        +
                    </div>
                </div>

                {/* Like Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLike}>
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/60 transition-all">
                        <Heart size={22} className={liked ? "text-red-500 fill-red-500" : "text-white"} />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">
                        {formatViewers(stream.viewers_count + (liked ? 1 : 0))}
                    </span>
                </div>

                {/* Comment Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/60 transition-all">
                        <MessageCircle size={22} fill={showComments ? "white" : "none"} className={showComments ? "text-white fill-white" : "text-white"} />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">View</span>
                </div>

                {/* Remix Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleRemix}>
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/60 transition-all">
                        <Repeat2 size={24} className={isRemixing ? "text-primary animate-spin" : "text-white"} />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">Remix</span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowShare(true); }}>
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/60 transition-all">
                        <Share2 size={22} fill="white" className="text-white" />
                    </div>
                    <span className="text-white text-[11px] font-bold drop-shadow-md">Share</span>
                </div>
            </div>

            {/* Overlay - Bottom Gradient & Info */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0" />
            <div className="absolute left-4 bottom-4 right-20 z-10 text-white" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-base mb-1 drop-shadow-lg flex items-center gap-2 cursor-pointer hover:underline">
                    @{channel.name || "user"}
                    {stream.status === "live" && (
                        <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse uppercase tracking-wider">
                            Live
                        </span>
                    )}
                </h3>
                <p className="text-sm drop-shadow-md mb-2">{stream.title}</p>
                <p className="text-[13px] text-white/80 drop-shadow-md">
                    {stream.description && <span className="line-clamp-2">{stream.description}</span>}
                </p>
            </div>

            {/* Modals & Overlays */}
            <CommentsPanel
                streamId={stream.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
            />

            <ShareModal
                streamId={stream.id}
                isOpen={showShare}
                onClose={() => setShowShare(false)}
            />
        </div>
    )
}
