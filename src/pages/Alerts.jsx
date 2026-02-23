"use client"

import { useEffect } from "react"
import { createClient } from "../lib/supabase/client"
import { Bell, X } from "lucide-react"
import { Card } from "../components/ui/card"
import { useNavigate } from "react-router-dom"

export default function Alerts() {
  const navigate = useNavigate()

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

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-balance">Alerts</h1>

        <div className="py-24 flex flex-col items-center justify-center text-center">
          <img
            src="/workspace-desk-setup-streaming.jpg"
            alt="No alerts illustration"
            className="w-64 max-w-full mb-8 rounded-lg opacity-80 mix-blend-luminosity"
          />
          <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            No new alerts right now. We'll notify you when your favorite channels go live or when there's new trending content.
          </p>
        </div>
      </div>
    </div>
  )
}
