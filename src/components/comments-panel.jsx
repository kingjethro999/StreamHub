"use client"

import { useCallback, useEffect, useState } from "react"
import { getCurrentUser, getComments, postComment } from "../lib/api"
import { X, Send, ChevronDown, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function CommentsPanel({ streamId, isOpen, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  // commentId => { replies, loading }
  const [repliesByParent, setRepliesByParent] = useState({})
  // commentId => true when reply input is open
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState("")

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      // Top-level comments only (parent_id is null)
      const data = await getComments(streamId)
      setComments(data || [])
    } catch (err) {
      console.error("Failed to fetch comments", err)
    } finally {
      setLoading(false)
    }
  }, [streamId])

  useEffect(() => {
    if (!isOpen) return
    fetchComments()
  }, [isOpen, streamId, fetchComments])

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      const comment = await postComment(streamId, newComment.trim())
      if (comment) {
        setComments([comment, ...comments])
        setNewComment("")
        onCommentAdded?.(comment)
      }
    } catch (err) {
      if (err?.code === "42P01") {
        alert("Database schema is missing — run `pnpm db:setup`.")
      } else {
        console.error("Failed to post comment:", err)
        alert(err?.message || "Could not post comment")
      }
    }
  }

  const toggleReplies = async (commentId) => {
    if (replyingTo === commentId) {
      setReplyingTo(null)
      return
    }
    setReplyingTo(commentId)
    try {
      const data = await getComments(streamId, { parent_id: commentId })
      setRepliesByParent((prev) => ({ ...prev, [commentId]: data || [] }))
    } catch (err) {
      console.error("Failed to fetch replies:", err)
    }
  }

  const handlePostReply = async (parentId) => {
    if (!replyText.trim() || !user) return
    try {
      const comment = await postComment(streamId, replyText.trim(), parentId)
      if (comment) {
        setRepliesByParent((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] || []), comment],
        }))
        setReplyText("")
        setReplyingTo(null)
        onCommentAdded?.(comment)
      }
    } catch (err) {
      console.error("Failed to post reply:", err)
      alert(err?.message || "Could not post reply")
    }
  }

  const repliesFor = (commentId) => repliesByParent[commentId] || []

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
          <h2 className="text-lg font-bold">
            Comments
            <span className="text-muted-foreground text-sm font-normal">({comments.length})</span>
          </h2>
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
            comments.map((comment) => {
              const isReplying = replyingTo === comment.id
              const replies = repliesFor(comment.id)
              const repliesLoaded = comment.id in repliesByParent
              return (
                <div key={comment.id} className="flex gap-3 relative group">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {(comment.profiles?.username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">@{comment.profiles?.username || "user"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90">{comment.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleReplies(comment.id)}
                        disabled={loading}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {repliesLoaded ? (
                          replies.length > 0 ? (
                            <>
                              <ChevronDown size={12} />
                              Reply ({replies.length})
                            </>
                          ) : (
                            <>
                              <ChevronDown size={12} />
                              Reply
                            </>
                          )
                        ) : (
                          <>
                            <ChevronRight size={12} />
                            Reply
                          </>
                        )}
                      </button>
                    </div>

                    {/* Reply input */}
                    {isReplying && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            handlePostReply(comment.id)
                          }}
                          className="flex gap-2 relative"
                        >
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 w-full bg-muted border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim()}
                            className="absolute right-1.5 top-1.5 bottom-1.5 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-opacity"
                          >
                            <Send size={14} className="ml-0.5" />
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Nested replies */}
                    {repliesLoaded && replies.length > 0 && (
                      <div className="mt-4 ml-8 border-l border-border/50 pl-4 space-y-3">
                        {replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex gap-2"
                          >
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage src={reply.profiles?.avatar_url} />
                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                {(reply.profiles?.username?.[0] || "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  @{reply.profiles?.username || "user"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-foreground/80">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
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
