"use client"

import { X } from "lucide-react"
import { Card } from "../components/ui/card"
import { Switch } from "../components/ui/switch"
import { Label } from "../components/ui/label"
import { useNavigate } from "react-router-dom"

export default function Settings() {
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

        <div className="max-w-3xl mx-auto pb-12">
          <h1 className="text-3xl font-bold mb-8 text-balance">Settings</h1>

          <div className="space-y-8">
            <Card className="p-6 border-border shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">🎨</span>
                Appearance
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="text-base font-semibold">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground mt-1">Experience StreamHub in a sleek dark theme.</p>
                  </div>
                  <Switch id="dark-mode" defaultChecked />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">🔔</span>
                Notifications
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications" className="text-base font-semibold">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground mt-1">Receive alerts when channels you follow go live or post new content.</p>
                  </div>
                  <Switch id="notifications" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">▶️</span>
                Playback
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-play" className="text-base font-semibold">Auto-play videos</Label>
                    <p className="text-sm text-muted-foreground mt-1">Automatically play the next video in your feed or queue.</p>
                  </div>
                  <Switch id="auto-play" defaultChecked />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <Label htmlFor="quality" className="text-base font-semibold">High Quality Streams</Label>
                    <p className="text-sm text-muted-foreground mt-1">Prioritize video quality over data usage.</p>
                  </div>
                  <Switch id="quality" defaultChecked />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
  )
}
