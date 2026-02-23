import { Outlet } from "react-router-dom"
import { Header } from "./header"
import { Navigation } from "./navigation"

export function Layout() {
    return (
        <div className="flex flex-col h-[100dvh] bg-background overflow-hidden relative">
            <Header />
            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar */}
                <div className="hidden md:block">
                    <Navigation />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative w-full">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden mt-auto z-50">
                <Navigation />
            </div>
        </div>
    )
}
