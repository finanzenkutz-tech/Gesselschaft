'use client'

import { useState } from 'react'
import { GameAdvisorModal } from '@/components/advisor/game-advisor-modal'
import { Bot, Sparkles } from 'lucide-react'

export function DrMeepleWidget() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 group origin-center transition-all duration-300 hover:scale-110"
            >
                <div className="absolute inset-0 bg-violet-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 animate-pulse" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white/20">
                    <Bot className="w-7 h-7" />
                    <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                    </div>
                </div>
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-lg border border-violet-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    <p className="font-bold text-violet-900 text-sm flex items-center gap-2">
                        Frag Dr. Meeple
                        <Sparkles className="w-3 h-3 text-amber-500" />
                    </p>
                </div>
            </button>

            <GameAdvisorModal open={open} onOpenChange={setOpen} />
        </>
    )
}
