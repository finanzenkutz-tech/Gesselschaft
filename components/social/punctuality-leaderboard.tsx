'use client'

import { Clock, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PunctualityStat } from '@/app/events/stats-actions'

export function PunctualityLeaderboard({ stats }: { stats: PunctualityStat[] }) {
    if (!stats || stats.length === 0) {
        return (
            <div className="sky-card p-6 flex flex-col items-center justify-center text-center min-h-[200px] border-dashed border-2 border-slate-200 bg-slate-50/50">
                <Clock className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-500">Noch keine Daten</h3>
                <p className="text-sm text-slate-400 max-w-[200px]">
                    Nehmt an mehr Events teil, um Statistiken zur Zuverlässigkeit zu sehen.
                </p>
            </div>
        )
    }

    const topThree = stats.slice(0, 3)
    const others = stats.slice(3)

    return (
        <section className="sky-card p-0 overflow-hidden border-none shadow-2xl bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-indigo-100" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Zuverlässigkeit</h2>
                            <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest">Wer kommt immer?</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Top 3 Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {topThree.map((stat, idx) => (
                        <motion.div
                            key={stat.user_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "flex flex-col items-center p-3 rounded-2xl border bg-slate-50/50 relative overflow-hidden",
                                idx === 0 ? "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-100" : "border-slate-100"
                            )}
                        >
                            {idx === 0 && (
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded-bl-xl">
                                    TOP 1
                                </div>
                            )}
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm mb-2">
                                <AvatarImage src={stat.avatar_url || undefined} />
                                <AvatarFallback>{stat.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <p className="font-bold text-xs truncate w-full text-center">{stat.full_name?.split(' ')[0]}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-lg font-black text-indigo-600">{stat.reliability_score}%</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Anwesenheit</p>
                        </motion.div>
                    ))}
                </div>

                {/* List View */}
                <div className="space-y-2 mt-4">
                    {stats.map((stat, idx) => (
                        <div key={stat.user_id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                            <div className="w-6 text-center font-bold text-slate-300 text-xs">#{idx + 1}</div>
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={stat.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{stat.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{stat.full_name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    {/* Mini Bars */}
                                    <div className="flex flex-col gap-0.5 w-24">
                                        <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase">
                                            <span>Anwesend</span>
                                            <span>{stat.reliability_score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full", stat.reliability_score >= 90 ? "bg-emerald-500" : stat.reliability_score >= 70 ? "bg-yellow-400" : "bg-red-400")}
                                                style={{ width: `${stat.reliability_score}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 w-24">
                                        <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase">
                                            <span>Pünktlich</span>
                                            <span>{stat.punctuality_score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full", stat.punctuality_score >= 90 ? "bg-emerald-500" : stat.punctuality_score >= 80 ? "bg-blue-400" : "bg-orange-400")}
                                                style={{ width: `${stat.punctuality_score}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
