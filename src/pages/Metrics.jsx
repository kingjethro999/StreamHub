"use client"

import { useEffect, useState } from "react"
import { metricsApi } from "../lib/api"

export default function Metrics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    metricsApi()
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading platform metrics…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-6">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load metrics</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const mdContent = `# StreamHub Platform Metrics

Generated: ${new Date().toISOString()}

## Overview
- **Total Users:** ${data.total_users.toLocaleString()}
- **Total Channels (Creators):** ${data.total_channels.toLocaleString()}
- **Total Streams (Posts):** ${data.total_streams.toLocaleString()}
- **Total Comments:** ${data.total_comments.toLocaleString()}
- **Total Likes:** ${data.total_likes.toLocaleString()}
- **Total Follows:** ${data.total_follows.toLocaleString()}

## First User
- **Name/Email:** ${data.first_user?.email || "N/A"}
- **Joined:** ${data.first_user?.created_at ? new Date(data.first_user.created_at).toLocaleDateString() : "N/A"}

## Top Hashtags
${data.top_hashtags?.length ? data.top_hashtags.map((h) => `- **${h.hashtag}**: ${h.count} uses`).join("\n") : "- No hashtags yet"}

## User Registration Over Time (from Feb 2026)
${data.users_over_time?.map((d) => `- ${d.date}: ${d.count} new user(s)`).join("\n") || "- No data"}

## Stream Publishing Over Time (from Feb 2026)
${data.streams_over_time?.map((d) => `- ${d.date}: ${d.count} new stream(s)`).join("\n") || "- No data"}
`

  const handleDownloadMd = () => {
    const blob = new Blob([mdContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "streamhub-metrics.md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = () => {
    window.print()
  }

  const formatDate = (iso) => {
    if (!iso) return "N/A"
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <header className="flex-none border-b border-border bg-card/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Metrics</h1>
          <p className="text-sm text-muted-foreground">
            StreamHub — usage data from February 2026 to present
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadMd}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download .md
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 21v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h14a1 1 0 011 1v5m-13 16v-2a1 1 0 011-1h6a1 1 0 011 1v2m-12-9h6m-6 4h6m-6-4v6m6-6v6"
              />
            </svg>
            Download .pdf
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Total Users"
              value={data.total_users.toLocaleString()}
              subtitle="Registered accounts"
              icon="users"
              trend="All time"
            />
            <MetricCard
              title="Total Streams"
              value={data.total_streams.toLocaleString()}
              subtitle="Posts published"
              icon="play"
              trend="All time"
            />
            <MetricCard
              title="Total Likes"
              value={data.total_likes.toLocaleString()}
              subtitle="Engagement"
              icon="heart"
              trend="All time"
            />
            <MetricCard
              title="Total Comments"
              value={data.total_comments.toLocaleString()}
              subtitle="Discussion"
              icon="message-circle"
              trend="All time"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Follows + Channels */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Creator Channels</h2>
                    <p className="text-sm text-muted-foreground">
                      Verified creator accounts on the platform
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {data.total_channels.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">channels</div>
                  </div>
                </div>
              </div>
            </div>

            {/* First User */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">First User</h2>
                    <p className="text-sm text-muted-foreground">
                      Earliest registered account on the platform
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {data.first_user?.email || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {formatDate(data.first_user?.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Chart */}
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">User Registration Over Time</h2>
              <p className="text-sm text-muted-foreground">
                New users per day from February 2026
              </p>
            </div>
            <div className="relative h-[300px] w-full overflow-x-auto">
              <div className="flex items-end gap-2 h-full min-w-[calc(100%+1rem)] pb-4">
                {data.users_over_time?.map((d) => {
                  const maxCount =
                    Math.max(
                      ...data.users_over_time.map((x) => x.count),
                    ) || 1
                  const height = Math.max(
                    (d.count / maxCount) * 100,
                    4,
                  )
                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center gap-1.5 transition-all duration-300"
                    >
                      <div
                        className="w-8 bg-primary/10 rounded-t-lg flex items-end justify-center h-full relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-primary bg-card/90 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap"
                        >
                          {d.count}
                        </div>
                        <div className="bg-primary h-full w-full rounded-t-lg" />
                      </div>
                      <span
                        className="text-[10px] text-muted-foreground whitespace-nowrap rotate-[-45deg] origin-bottom-left"
                      >
                        {d.date}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Streams Chart */}
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Streams Published Over Time</h2>
              <p className="text-sm text-muted-foreground">
                New streams per day from February 2026
              </p>
            </div>
            <div className="relative h-[300px] w-full overflow-x-auto">
              <div className="flex items-end gap-2 h-full min-w-[calc(100%+1rem)] pb-4">
                {data.streams_over_time?.map((d) => {
                  const maxCount =
                    Math.max(
                      ...data.streams_over_time.map((x) => x.count),
                    ) || 1
                  const height = Math.max(
                    (d.count / maxCount) * 100,
                    4,
                  )
                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center gap-1.5 transition-all duration-300"
                    >
                      <div
                        className="flex items-end justify-center h-full relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-primary bg-card/90 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap"
                        >
                          {d.count}
                        </div>
                        <div className="bg-primary h-full w-full rounded-t-lg" />
                      </div>
                      <span
                        className="text-[10px] text-muted-foreground whitespace-nowrap rotate-[-45deg] origin-bottom-left"
                      >
                        {d.date}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top Hashtags */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Top Hashtags</h2>
              <p className="text-sm text-muted-foreground">
                Most used tags across stream titles and descriptions
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.top_hashtags?.length ? (
                data.top_hashtags.map((h, i) => {
                  const maxCount =
                    Math.max(
                      ...data.top_hashtags.map((x) => x.count),
                    ) || 1
                  const barWidth = Math.min((h.count / maxCount) * 100, 100)
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/50 ${
                        i === 0 ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <span className={`text-2xl font-bold ${
                        i === 0 ? "text-primary" : "text-primary/20"
                      }`}>
                        #{i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            #{h.hashtag}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                            {h.count}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted/30 mt-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hashtags used yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function MetricCard({ title, value, subtitle, trend }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{trend}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  )
}
