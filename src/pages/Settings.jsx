import { useState, useEffect } from "react"
import { X, Palette, Bell, PlayCircle, History, ChevronRight } from "lucide-react"
import { Card } from "../components/ui/card"
import { Switch } from "../components/ui/switch"
import { Label } from "../components/ui/label"
import { useNavigate, Link } from "react-router-dom"

export default function Settings() {
  const navigate = useNavigate()

  // Load initial states from localStorage or default to false/true
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("setting_darkMode") !== "false")
  const [pushNotifications, setPushNotifications] = useState(() => localStorage.getItem("setting_notifications") === "true")
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem("setting_autoPlay") !== "false")
  const [highQuality, setHighQuality] = useState(() => localStorage.getItem("setting_highQuality") !== "false")

  // Update localStorage when states change
  useEffect(() => {
    localStorage.setItem("setting_darkMode", darkMode)
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem("setting_notifications", pushNotifications)
    if (pushNotifications) {
      console.log("Email notifications enabled via GMAIL_SMTP_USER:", import.meta.env.VITE_GMAIL_SMTP_USER || "this.is.dev.space@gmail.com")
    }
  }, [pushNotifications])

  useEffect(() => {
    localStorage.setItem("setting_autoPlay", autoPlay)
  }, [autoPlay])

  useEffect(() => {
    localStorage.setItem("setting_highQuality", highQuality)
  }, [highQuality])

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
              <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">
                <History size={18} />
              </span>
              Activity
            </h2>
            <div className="space-y-6">
              <Link to="/activity" className="flex items-center justify-between group cursor-pointer hover:bg-card-hover p-2 -mx-2 rounded-lg transition-colors">
                <div>
                  <Label className="text-base font-semibold cursor-pointer group-hover:text-primary transition-colors">My Activity</Label>
                  <p className="text-sm text-muted-foreground mt-1 cursor-pointer">View your watch history, likes, and interactions.</p>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </Card>

          <Card className="p-6 border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">
                <Palette size={18} />
              </span>
              Appearance
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="text-base font-semibold">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground mt-1">Experience StreamHub in a sleek dark theme.</p>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">
                <Bell size={18} />
              </span>
              Notifications
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="text-base font-semibold">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">Receive alerts when channels you follow go live or post new content.</p>
                </div>
                <Switch id="notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center">
                <PlayCircle size={18} />
              </span>
              Playback
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-play" className="text-base font-semibold">Auto-play videos</Label>
                  <p className="text-sm text-muted-foreground mt-1">Automatically play the next video in your feed or queue.</p>
                </div>
                <Switch id="auto-play" checked={autoPlay} onCheckedChange={setAutoPlay} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <Label htmlFor="quality" className="text-base font-semibold">High Quality Streams</Label>
                  <p className="text-sm text-muted-foreground mt-1">Prioritize video quality over data usage.</p>
                </div>
                <Switch id="quality" checked={highQuality} onCheckedChange={setHighQuality} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
