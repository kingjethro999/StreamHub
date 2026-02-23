import { useLocation, Link } from "react-router-dom"
import { Home, Search, Video, PlusSquare, Bell, User } from "lucide-react"

export function Navigation() {
  const location = useLocation()
  const pathname = location.pathname

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/upload", icon: PlusSquare, label: "Upload" },
    { href: "/alerts", icon: Bell, label: "Alerts" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <nav className="bg-card w-full h-full flex md:flex-col border-t md:border-t-0 md:border-r border-border">
      <div className="flex md:flex-col justify-around md:justify-start items-center md:items-stretch h-16 md:h-full md:p-4 gap-2 w-full md:w-20 lg:w-64">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              to={href}
              className={`flex flex-col lg:flex-row items-center lg:justify-start gap-1 lg:gap-4 px-4 py-2 md:py-3 md:rounded-xl transition-all ${isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
              <span className={`text-[10px] md:text-xs lg:text-base font-medium ${isActive ? "font-bold" : ""}`}>
                <span className="md:hidden lg:inline">{label}</span>
                <span className="hidden md:inline lg:hidden">{label.slice(0, 4)}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
