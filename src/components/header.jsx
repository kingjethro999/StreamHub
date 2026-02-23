"use client"

import { Settings } from "lucide-react"
import { Link } from "react-router-dom"

export function Header() {
  return (
    <header className="border-b border-border px-4 md:px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          S
        </div>
        <h1 className="text-2xl font-bold text-foreground">StreamHub</h1>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/settings" className="text-foreground hover:text-primary transition-colors" title="Settings">
          <Settings size={24} />
        </Link>
      </div>
    </header>
  )
}
