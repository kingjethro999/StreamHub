"use client"

import { X, Copy, Check, Twitter, Facebook, MessageCircle } from "lucide-react"
import { useState } from "react"

export function ShareModal({ streamId, isOpen, onClose }) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

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

                <div className="grid grid-cols-4 gap-4 mb-8">
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center group-hover:bg-[#1DA1F2] group-hover:text-white transition-colors">
                            <Twitter size={24} />
                        </div>
                        <span className="text-xs font-medium">Twitter</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                            <Facebook size={24} />
                        </div>
                        <span className="text-xs font-medium">Facebook</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                            <MessageCircle size={24} />
                        </div>
                        <span className="text-xs font-medium">WhatsApp</span>
                    </button>
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
