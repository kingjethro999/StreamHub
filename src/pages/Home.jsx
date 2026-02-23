"use client"

import { SwipeFeed } from "../components/swipe-feed"

export default function Home() {
  return (
    <div className="flex-1 w-full h-full relative">
      <main className="flex-1 overflow-hidden relative">
        <SwipeFeed />
      </main>
      </div>
  )
}
