"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { HomeIcon, Search, Activity, Bell, User } from "lucide-react"

const navItems = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-t border-border px-4 md:px-6 py-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between md:justify-around max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 md:px-4 py-2 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
