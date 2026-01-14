import { Trophy, Medal, Crown, Star } from 'lucide-react'

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
            case 0: return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
            case 1: return 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
            case 2: return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
            default: return 'bg-white border-slate-100'
        }
    }

    return (
        <section className="sky-card p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                    Bestenliste
                </h2>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Star className="w-4 h-4" />
                    Top 20
                </div>
            </div>

            {entries.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Noch keine Punkte vergeben.</p>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry, idx) => (
                        <div
                            key={entry.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border ${getRowStyle(idx)} transition-all hover:scale-[1.01]`}
                        >
                            <div className="w-8 h-8 flex items-center justify-center">
                                {getMedalIcon(idx)}
                            </div>

                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary overflow-hidden border-2 border-white shadow-md">
                                {entry.avatar_url ? (
                                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    entry.full_name?.[0]?.toUpperCase() || '?'
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{entry.full_name || 'Anonym'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {entry.badges?.slice(0, 3).map((badge, bidx) => (
                                        <span key={bidx} className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-[10px] font-bold">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-extrabold text-primary">{entry.points}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Punkte</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
