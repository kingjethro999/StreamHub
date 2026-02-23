"use client"

import { Crown, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border px-4 md:px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          S
        </div>
        <h1 className="text-2xl font-bold text-foreground">StreamHub</h1>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/analytics" className="text-foreground hover:text-primary transition-colors" title="Analytics">
          <BarChart3 size={24} />
        </Link>
        <Link href="/premium" className="text-foreground hover:text-primary transition-colors" title="Premium">
          <Crown size={24} />
        </Link>
        <Link href="/settings" className="text-foreground hover:text-primary transition-colors" title="Settings">
          <Settings size={24} />
        </Link>
      </div>
    </header>
  )
}
