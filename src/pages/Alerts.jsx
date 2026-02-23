"use client"

import { Bell, X } from "lucide-react"
import { Card } from "../components/ui/card"
import { useNavigate } from "react-router-dom"

export default function Alerts() {
  const navigate = useNavigate()

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

          <div className="py-16 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="text-primary" size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              No new alerts right now. We'll notify you when your favorite channels go live or when there's new trending content.
            </p>
          </div>
        </div>
      </div>
  )
}
