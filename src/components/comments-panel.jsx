"use client"

import { useEffect, useState } from "react"
import { createClient } from "../lib/supabase/client"
import { X, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function CommentsPanel({ streamId, isOpen, onClose }) {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    useEffect(() => {
        if (!isOpen) return

        const fetchComments = async () => {
            const supabase = createClient()
            setLoading(true)

            // Get user
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            setUser(currentUser)

            try {
                // Fetch comments with user profile info
                const { data, error } = await supabase
                    .from("comments")
                    .select(`
                        *,
                        profiles(username, avatar_url)
                    `)
                    .eq("stream_id", streamId)
                    .order("created_at", { ascending: false })

                if (error && error.code !== '42P01') {
                    // 42P01 is undefined table (if user didn't run SQL yet)
                    console.error("Error fetching comments:", error)
                } else if (data) {
                    setComments(data)
                }
            } catch (err) {
                console.error("Failed to fetch comments", err)
            } finally {
                setLoading(false)
            }
        }

        fetchComments()
    }, [isOpen, streamId])

    const handlePostComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || !user) return

        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from("comments")
                .insert({
                    stream_id: streamId,
                    user_id: user.id,
                    content: newComment.trim()
                })
                .select(`*, profiles(username, avatar_url)`)
                .single()

            if (error) {
                if (error.code === '42P01') {
                    alert("Please run the db.sql script to create the 'comments' table!")
                } else throw error
            }

            if (data) {
                setComments([data, ...comments])
                setNewComment("")
            }
        } catch (err) {
            console.error("Failed to post comment:", err)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="fixed top-0 right-0 z-50 w-full max-w-sm h-[100dvh] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-lg font-bold">Comments <span className="text-muted-foreground text-sm font-normal">({comments.length})</span></h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No comments yet.</p>
                            <p className="text-sm">Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={comment.profiles?.avatar_url} />
                                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                        {(comment.profiles?.username?.[0] || 'U').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">@{comment.profiles?.username || 'user'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/90">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-background">
                    {user ? (
                        <form onSubmit={handlePostComment} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 w-full bg-muted border-none rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="absolute right-1.5 top-1.5 bottom-1.5 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-opacity"
                            >
                                <Send size={14} className="ml-0.5" />
                            </button>
                        </form>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground">Log in to comment.</p>
                    )}
                </div>
            </div>
        </>
    )
}
