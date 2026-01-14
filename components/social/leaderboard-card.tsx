import { Trophy, Medal, Crown, Star } from 'lucide-react'
import { getLevelInfo } from '@/lib/utils/gamification'

type LeaderboardEntry = {
    id: string
    full_name: string | null
    avatar_url: string | null
    points: number
    badges: string[]
}

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
    const getMedalIcon = (position: number) => {
        switch (position) {
            case 0: return <Crown className="w-5 h-5 text-yellow-500" />
            case 1: return <Medal className="w-5 h-5 text-slate-400" />
            case 2: return <Medal className="w-5 h-5 text-amber-600" />
            default: return <span className="text-sm font-bold text-slate-400">{position + 1}</span>
        }
    }

    const getRowStyle = (position: number) => {
        switch (position) {
            case 0: return 'bg-amber-50/50 border-amber-200'
            case 1: return 'bg-slate-50/50 border-slate-200'
            case 2: return 'bg-orange-50/50 border-orange-200'
            default: return 'bg-white border-slate-100'
        }
    }

    return (
        <section className="sky-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    Bestenliste
                </h2>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                    <Star className="w-3 h-3" />
                    Top 20
                </div>
            </div>

            {entries.length === 0 ? (
                <p className="text-slate-400 text-center py-8 italic underline decoration-blue-100 underline-offset-4">Noch keine Punkte vergeben.</p>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry, idx) => (
                        <div
                            key={entry.id}
                            className={`flex items-center gap-4 p-4 md:p-5 rounded-[1.5rem] border shadow-sm ${getRowStyle(idx)} transition-all hover:translate-x-1`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                {getMedalIcon(idx)}
                            </div>

                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center text-xl font-bold text-primary overflow-hidden border-2 border-white shadow-lg shrink-0">
                                {entry.avatar_url ? (
                                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary/40 font-black">{entry.full_name?.[0]?.toUpperCase() || '?'}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-slate-900 text-lg leading-none">{entry.full_name || 'Anonym'}</p>
                                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                        Lvl {getLevelInfo(entry.points).level}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    {entry.badges?.slice(0, 3).map((badge, bidx) => (
                                        <span key={bidx} className="px-2 py-0.5 bg-white/80 border border-purple-100 text-purple-600 rounded-md text-[9px] font-bold uppercase tracking-tight">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <p className="text-3xl font-black text-primary leading-none tracking-tight">{entry.points}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Punkte</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
