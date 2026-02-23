"use client"

import { useState, useEffect } from "react"
import { createClient } from "../lib/supabase/client"
import { X, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { useNavigate } from "react-router-dom"
import CloudinaryUploadWidget from "../components/CloudinaryUploadWidget"

export default function Upload() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("upload") // "upload" | "live"
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)

    // Cloudinary Widget state
    const [publicId, setPublicId] = useState("")
    const [videoUrl, setVideoUrl] = useState("")
    const [thumbnailUrl, setThumbnailUrl] = useState("")

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                navigate("/auth/login")
            }
        }
        checkAuth()
    }, [navigate])

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!videoUrl || !title) {
            setError("Please upload a video and provide a title.")
            return
        }

        try {
            setUploading(true)
            setError(null)

            // Save to Supabase
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("You must be logged in to upload")
            }

            // Fetch the channel for the user
            const { data: channelData } = await supabase
                .from("channels")
                .select("id")
                .eq("user_id", user.id)
                .single()

            const channelId = channelData?.id

            if (!channelId) {
                throw new Error("You must create a channel before uploading. Go to Settings to set up your profile.")
            }

            const { error: dbError } = await supabase
                .from("streams")
                .insert({
                    title,
                    description,
                    status: "live", // Mark as live so it shows up in the feed
                    viewers_count: 0,
                    thumbnail_url: thumbnailUrl,
                    video_url: videoUrl,
                    channel_id: channelId,
                })

            if (dbError) throw dbError

            navigate("/") // go back to feed on success
        } catch (err) {
            console.error(err)
            setError(err.message || "An unexpected error occurred during saving")
        } finally {
            setUploading(false)
        }
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "images"

    const uwConfig = {
        cloudName,
        uploadPreset,
        multiple: false,
        resourceType: "video",
        clientAllowedFormats: ["mp4", "webm", "mkv", "mov"],
        maxFileSize: 104857600, // 100MB
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

            <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-balance">Create Content</h1>

                <div className="flex bg-muted p-1 rounded-xl mb-6">
                    <button
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "upload" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setActiveTab("upload")}
                    >
                        Upload Short
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "live" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setActiveTab("live")}
                    >
                        Live Stream
                    </button>
                </div>

                <Card className="p-6 border border-border bg-card">
                    {activeTab === "upload" ? (
                        <form onSubmit={handleUpload} className="space-y-6">
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">Video File</label>
                                {!videoUrl ? (
                                    <CloudinaryUploadWidget
                                        uwConfig={uwConfig}
                                        setPublicId={setPublicId}
                                        setVideoUrl={setVideoUrl}
                                        setThumbnailUrl={setThumbnailUrl}
                                    />
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
                                            <video
                                                src={videoUrl}
                                                poster={thumbnailUrl}
                                                controls
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-sm font-medium text-muted-foreground truncate mr-4">
                                                {videoUrl.split('/').pop()}
                                            </span>
                                            <Button type="button" variant="outline" size="sm" onClick={() => { setVideoUrl(""); setThumbnailUrl(""); setPublicId(""); }}>
                                                Change Video
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Catchy title for your short"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                                    placeholder="Tell viewers what this is about..."
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={uploading || !videoUrl || !title}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Post Video"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <img
                                src="/workspace-desk-setup-streaming.jpg"
                                alt="Live streaming coming soon"
                                className="w-64 max-w-full mb-8 rounded-lg opacity-80 mix-blend-luminosity"
                            />
                            <h3 className="text-xl font-bold text-foreground mb-2">Live Streaming</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Broadcast yourself to the world in real-time. This feature is coming soon in a future update!
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
