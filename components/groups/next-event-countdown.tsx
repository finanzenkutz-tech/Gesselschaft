'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

export function NextEventCountdown({ nextEvent }: { nextEvent: any }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number }>({ days: 0, hours: 0, minutes: 0 })

    useEffect(() => {
        if (!nextEvent) return

        const calculateTimeLeft = () => {
            const difference = +new Date(nextEvent.start_time) - +new Date()

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                }
            }
            return { days: 0, hours: 0, minutes: 0 }
        }

        setTimeLeft(calculateTimeLeft())

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 60000) // Update every minute is enough

        return () => clearInterval(timer)
    }, [nextEvent])

    if (!nextEvent) return null

    return (
        <div className="w-full bg-slate-900/40 backdrop-blur-sm border-t border-white/10 p-4 animate-in slide-in-from-bottom flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/50">
                    <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Nächstes Event</p>
                    <p className="font-bold text-lg leading-tight">{nextEvent.title}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex gap-4 text-center">
                    <div>
                        <span className="block text-2xl font-black font-mono">{timeLeft.days}</span>
                        <span className="text-[10px] uppercase font-bold opacity-60">Tage</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-black font-mono">{timeLeft.hours}</span>
                        <span className="text-[10px] uppercase font-bold opacity-60">Std</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-black font-mono">{timeLeft.minutes}</span>
                        <span className="text-[10px] uppercase font-bold opacity-60">Min</span>
                    </div>
                </div>

                <Link href={`/events/${nextEvent.id}`}>
                    <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-colors">
                        Zum Event
                    </button>
                </Link>
            </div>
        </div>
    )
}
