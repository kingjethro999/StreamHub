"use client"

import { useEffect, useState } from "react"
import { createClient } from "../lib/supabase/client"
import { Clock, X } from "lucide-react"
import { Card } from "../components/ui/card"
import { useNavigate } from "react-router-dom"

export default function Activity() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])

  useEffect(() => {
    const fetchActivities = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Fetch user's activity
        const { data } = await supabase.from("follows").select("*, channel:channels(*)").eq("follower_id", user.id)

        setActivities(data || [])
      } else {
        navigate("/auth/login")
      }
    }

    fetchActivities()
  }, [])

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
        <h1 className="text-3xl font-bold mb-6 text-balance">Your Activity</h1>

        {activities.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <img
              src="/workspace-desk-setup-streaming.jpg"
              alt="Empty state illustration"
              className="w-64 max-w-full mb-8 rounded-lg opacity-80 mix-blend-luminosity"
            />
            <h2 className="text-2xl font-bold mb-2">No activity yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start following channels and interacting with streams to see your history appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <p className="text-foreground">
                  You followed <span className="font-semibold text-primary">{activity.channel?.name}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
