"use client"

import { X, Copy, Check, MessageCircle, Share2 } from "lucide-react"
import { useState, useEffect } from "react"

// lucide-react v1 dropped brand icons, so X/Twitter and Facebook keep
// their own inline glyphs.
function XIcon({ size = 24 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

function FacebookIcon({ size = 24 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
            <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94z" />
        </svg>
    )
}

export function ShareModal({ streamId, isOpen, onClose }) {
    const [copied, setCopied] = useState(false)
    const [nativeShareAvailable, setNativeShareAvailable] = useState(false)

    useEffect(() => {
        setNativeShareAvailable(typeof navigator.share === "function")
    }, [])

    const shareUrl = `${window.location.origin}/stream/${streamId}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    if (!isOpen) return null

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: "Watch this on StreamHub",
                text: "Check out this short on StreamHub",
                url: shareUrl,
            })
        } catch (err) {
            if (err.name !== "AbortError") console.error("Native share failed:", err)
        }
    }

    const shareText = encodeURIComponent("Watch this live on StreamHub!")
    const encodedUrl = encodeURIComponent(shareUrl)

    const openWindow = (url) => window.open(url, "_blank", "noopener,noreferrer")

    const shareTargets = [
        {
            label: "X",
            icon: <XIcon size={24} />,
            className: "bg-[#1DA1F2]/10 text-[#1DA1F2] group-hover:bg-[#1DA1F2] group-hover:text-white",
            onClick: () => openWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`),
        },
        {
            label: "Facebook",
            icon: <FacebookIcon size={24} />,
            className: "bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white",
            onClick: () => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
        },
        {
            label: "WhatsApp",
            icon: <MessageCircle size={24} />,
            className: "bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white",
            onClick: () => openWindow(`https://wa.me/?text=${shareText}%20${encodedUrl}`),
        },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full sm:w-[400px] bg-card rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-5 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Share to</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {nativeShareAvailable && (
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-colors group-hover:bg-primary/90">
                                <Share2 size={20} />
                            </div>
                            <span className="text-xs font-medium">Device</span>
                        </button>
                    )}
                    {shareTargets.map(({ label, icon, className, onClick }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={onClick}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${className}`}>
                                {icon}
                            </div>
                            <span className="text-xs font-medium">{label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-muted p-2 rounded-xl">
                    <div className="truncate flex-1 px-3 text-sm text-muted-foreground outline-none bg-transparent">
                        {shareUrl}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center min-w-[80px] hover:opacity-90 transition-opacity"
                    >
                        {copied ? (
                            <>
                                <Check size={16} className="mr-1" /> Copied
                            </>
                        ) : (
                            <>
                                <Copy size={16} className="mr-1" /> Copy
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
