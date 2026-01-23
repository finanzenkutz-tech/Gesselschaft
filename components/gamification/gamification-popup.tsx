'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'
import { getBadge } from '@/lib/utils/gamification'
import { Trophy, Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GamificationPopupProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    badgesEarned?: string[]
    xpEarned?: number
    title?: string
    message?: string
    nextMilestone?: {
        current: number
        target: number
        label?: string
    }
}

export function GamificationPopup({
    open,
    onOpenChange,
    badgesEarned = [],
    xpEarned = 0,
    title = "Glückwunsch!",
    message,
    nextMilestone
}: GamificationPopupProps) {
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        if (open) {
            // Trigger confetti
            const duration = 3000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now()

                if (timeLeft <= 0) {
                    return clearInterval(interval)
                }

                const particleCount = 50 * (timeLeft / duration)

                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                })
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                })
            }, 250)

            // Delayed content animation
            setTimeout(() => setShowContent(true), 300)

            return () => clearInterval(interval)
        } else {
            setShowContent(false)
        }
    }, [open])

    const badge = badgesEarned.length > 0 ? getBadge(badgesEarned[0]) : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-none shadow-none bg-transparent p-0 overflow-visible">
                <div className={cn(
                    "bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-700 transform",
                    showContent ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10"
                )}>
                    {/* Header Background */}
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 text-center relative overflow-hidden">

                        {/* Background Shine Effect */}
                        <div className="absolute inset-0 bg-white/10 blur-3xl transform -rotate-45 translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            {badge ? (
                                <div className={cn(
                                    "w-32 h-32 bg-white rounded-3xl flex items-center justify-center text-7xl shadow-2xl mb-6 transform transition-transform duration-500 hover:scale-110",
                                    "animate-in zoom-in-50 duration-500 delay-150"
                                )}>
                                    {badge.icon}
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg mb-6 animate-bounce">
                                    <Trophy className="w-12 h-12" />
                                </div>
                            )}

                            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">
                                {badge ? `Neues Abzeichen!` : title}
                            </h2>
                            {badge && (
                                <p className="text-white/90 font-medium text-lg bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm">
                                    {badge.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center space-y-6">
                        {badge ? (
                            <p className="text-slate-600 text-lg">
                                {badge.description}
                            </p>
                        ) : (
                            <p className="text-slate-600 text-lg">
                                {message}
                            </p>
                        )}

                        {xpEarned > 0 && (
                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center gap-3 border border-slate-100">
                                <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
                                    <Star className="w-5 h-5 fill-yellow-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Erfahrungspunkte</p>
                                    <p className="text-xl font-black text-slate-800">+{xpEarned} XP</p>
                                </div>
                            </div>
                        )}

                        {nextMilestone && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-slate-500">
                                    <span>Nächstes Ziel:</span>
                                    <span>{nextMilestone.current} / {nextMilestone.target} {nextMilestone.label || 'Ideen'}</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${(nextMilestone.current / nextMilestone.target) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-14 font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Großartig! <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
