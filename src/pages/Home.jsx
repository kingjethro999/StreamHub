"use client"

import { SwipeFeed } from "../components/swipe-feed"

export default function Home() {
  return (
    <div className="flex-1 w-full relative">
      <main className="flex-1 min-h-[calc(100vh-64px)] overflow-hidden relative border-none">
        <SwipeFeed />
      </main>
    </div>
  )
}
