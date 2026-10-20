"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Settings, Bell, ChevronRight, Clock, User as UserIcon } from "lucide-react"
import { getCurrentUser, getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from "../lib/api"

function formatRelative(dateString) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function Header() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const [notifs, unread] = await Promise.all([
            getNotifications({ limit: 10 }),
            getUnreadCount(),
          ])
          setNotifications(notifs || [])
          setUnreadCount(unread.count || 0)
        }
      } catch {
        /* not signed in */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      /* non-fatal */
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      /* non-fatal */
    }
  }

  if (loading) return null

  return (
    <header className="border-b border-border px-4 md:px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/mylogo.png" alt="StreamHub Logo" className="w-10 h-10 object-contain" />
        <h1 className="text-2xl font-bold text-foreground">StreamHub</h1>
      </Link>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-label="Notifications"
          className="relative p-2 rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 z-20 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {dropdownOpen && user && (
          <NotificationsDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onClose={() => setDropdownOpen(false)}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />
        )}

        <Link to="/settings" className="text-foreground hover:text-primary transition-colors" title="Settings">
          <Settings size={24} />
        </Link>
      </div>
    </header>
  )
}

function NotificationsDropdown({
  notifications,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) {
  return (
    <div
      className="fixed top-14 right-0 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto py-1">
        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.read) onMarkRead(n.id)
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                n.read ? "bg-transparent" : "bg-primary/5"
              }`}
            >
              <div className="flex-shrink-0 p-1.5 rounded bg-muted text-primary">
                {n.type === "live" ? (
                  <UserIcon size={16} />
                ) : n.type === "like" ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ) : n.type === "follow" ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M15.33 5.66c-.32-.4-.85-.65-1.43-.65H10c-1.1 0-2 .9-2 2v4H5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-2.33c-.58 0-1.11-.25-1.43-.65L13 8.84 15.33 5.66zM12 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                ) : (
                  <Clock size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {n.type === "live"
                      ? `${n.actor?.username ?? "Someone"} went live`
                      : n.type === "like"
                      ? `${n.actor?.username ?? "Someone"} liked your video`
                      : n.type === "follow"
                      ? `${n.actor?.username ?? "Someone"} followed you`
                      : `${n.actor?.username ?? "Someone"} commented on your video`}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelative(n.created_at)}
                  </span>
                </div>
                {n.stream?.title && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    "{n.stream.title}"
                  </p>
                )}
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary"></span>}
            </button>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-border">
        <button
          type="button"
          onClick={() => {
            onClose()
            window.location.href = "/alerts"
          }}
          className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight size={14} />
          View all notifications
        </button>
      </div>
    </div>
  )
}
