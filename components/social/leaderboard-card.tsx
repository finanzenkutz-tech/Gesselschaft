import { Trophy, Medal, Crown, Star } from 'lucide-react'
import { getLevelInfo } from '@/lib/utils/gamification'
import { cn } from '@/lib/utils'

type LeaderboardEntry = {
    id: string
    full_name: string | null
    avatar_url: string | null
    points: number
    badges: string[]
}

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
    const topThree = entries.slice(0, 3)
    const others = entries.slice(3)

    return (
        <section className="sky-card p-0 overflow-hidden border-none shadow-2xl bg-slate-50/30">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Trophy className="w-7 h-7 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Bestenliste</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Top 20 Spieler</p>
                        </div>
                    </div>
                </div>

                {/* Podium View */}
                {topThree.length > 0 && (
                    <div className="mt-12 flex items-baseline justify-center gap-4 pb-4">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <div className="flex flex-col items-center gap-2 group animate-in slide-in-from-bottom-8 duration-700 delay-100">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden bg-white/10 backdrop-blur-sm p-1 shadow-xl group-hover:scale-110 transition-transform">
                                        {topThree[1].avatar_url ? (
                                            <img src={topThree[1].avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                                {topThree[1].full_name?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -left-2 bg-slate-300 text-slate-900 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md border-2 border-slate-800">2</div>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs truncate max-w-[80px] text-slate-300">{topThree[1].full_name || 'Spieler'}</p>
                                    <p className="text-[10px] font-black text-slate-400">{topThree[1].points} XP</p>
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <div className="flex flex-col items-center gap-3 group animate-in slide-in-from-bottom-12 duration-1000">
                                <div className="relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                                        <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                                    </div>
                                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden bg-white/20 backdrop-blur-sm p-1 shadow-[0_0_20px_rgba(250,204,21,0.3)] group-hover:scale-110 transition-transform">
                                        {topThree[0].avatar_url ? (
                                            <img src={topThree[0].avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-primary font-black text-2xl">
                                                {topThree[0].full_name?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg border-2 border-slate-800">1</div>
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-sm truncate max-w-[120px] text-white underline decoration-yellow-400/50 underline-offset-4">{topThree[0].full_name || 'Spieler'}</p>
                                    <p className="text-xs font-black text-yellow-400 drop-shadow-md">{topThree[0].points} XP</p>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <div className="flex flex-col items-center gap-2 group animate-in slide-in-from-bottom-8 duration-700 delay-200">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-amber-600/50 overflow-hidden bg-white/10 backdrop-blur-sm p-1 shadow-xl group-hover:scale-110 transition-transform">
                                        {topThree[2].avatar_url ? (
                                            <img src={topThree[2].avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                                {topThree[2].full_name?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-amber-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md border-2 border-slate-800">3</div>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs truncate max-w-[80px] text-slate-300">{topThree[2].full_name || 'Spieler'}</p>
                                    <p className="text-[10px] font-black text-slate-400">{topThree[2].points} XP</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Others List */}
            <div className="p-4 md:p-6 space-y-3">
                {others.length === 0 && topThree.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 italic">Noch keine Punkte vergeben.</p>
                ) : (
                    others.map((entry, idx) => {
                        const levelInfo = getLevelInfo(entry.points)
                        return (
                            <div
                                key={entry.id}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:translate-x-1 group"
                            >
                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-black text-slate-300 group-hover:text-primary transition-colors">#{idx + 4}</span>
                                </div>

                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-primary overflow-hidden border-2 border-white shadow-sm shrink-0">
                                    {entry.avatar_url ? (
                                        <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-300 font-black">{entry.full_name?.[0]?.toUpperCase() || '?'}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-slate-800 text-sm leading-none truncate">{entry.full_name || 'Spieler'}</p>
                                        <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md border shrink-0", levelInfo.color, "bg-white border-slate-100")}>
                                            LVL {levelInfo.level}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                        {entry.badges?.slice(0, 2).map((badge, bidx) => (
                                            <span key={bidx} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-bold uppercase letter-tracking-tight">
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-primary leading-none tabular-nums tracking-tight">{entry.points}</p>
                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Punkte</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </section>
    )
}
