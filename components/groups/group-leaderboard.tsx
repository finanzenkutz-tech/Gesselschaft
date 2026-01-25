'use client'

import { Trophy, Medal, Star, Hash, PlayCircle, Coins } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
    id: string
    full_name: string | null
    avatar_url: string | null
    wins: number
    totalScore: number
    gamesPlayed: number
}

interface GroupLeaderboardProps {
    data: LeaderboardEntry[]
}

export function GroupLeaderboard({ data }: GroupLeaderboardProps) {
    if (!data || data.length === 0) return null

    const topThree = data.slice(0, 3)
    const others = data.slice(3)

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Bestenliste
            </h2>

            {/* Podium */}
            <div className="grid grid-cols-3 gap-4 items-end pb-4 pt-10">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="flex flex-col items-center gap-2 text-center order-1">
                        <div className="relative">
                            <Avatar className="w-16 h-16 border-2 border-slate-200 shadow-md">
                                <AvatarImage src={topThree[1].avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-100">{topThree[1].full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">2</div>
                        </div>
                        <div className="mt-2">
                            <p className="text-xs font-bold text-slate-700 truncate w-20 mx-auto">{topThree[1].full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{topThree[1].wins} Siege</p>
                        </div>
                        <div className="w-full h-16 bg-slate-100 rounded-t-2xl mt-2 border-t border-x border-slate-200/50" />
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="flex flex-col items-center gap-2 text-center order-2 scale-110">
                        <div className="relative">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl animate-bounce duration-1000">👑</div>
                            <Avatar className="w-20 h-20 border-4 border-amber-300 shadow-xl ring-4 ring-amber-100">
                                <AvatarImage src={topThree[0].avatar_url || undefined} />
                                <AvatarFallback className="bg-amber-50 text-amber-600">{topThree[0].full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">1</div>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm font-black text-slate-800 truncate w-24 mx-auto">{topThree[0].full_name}</p>
                            <div className="flex items-center justify-center gap-1">
                                <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider">{topThree[0].wins} Siege</p>
                            </div>
                        </div>
                        <div className="w-full h-24 bg-gradient-to-t from-amber-100/50 to-amber-50/30 rounded-t-2xl mt-2 border-t-2 border-x-2 border-amber-200/50" />
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="flex flex-col items-center gap-2 text-center order-3">
                        <div className="relative">
                            <Avatar className="w-14 h-14 border-2 border-orange-200 shadow-md">
                                <AvatarImage src={topThree[2].avatar_url || undefined} />
                                <AvatarFallback className="bg-orange-50">{topThree[2].full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-300 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">3</div>
                        </div>
                        <div className="mt-2">
                            <p className="text-xs font-bold text-slate-700 truncate w-20 mx-auto">{topThree[2].full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{topThree[2].wins} Siege</p>
                        </div>
                        <div className="w-full h-12 bg-orange-50/50 rounded-t-2xl mt-2 border-t border-x border-orange-100/50" />
                    </div>
                )}
            </div>

            {/* List for the rest */}
            {others.length > 0 && (
                <div className="space-y-2 pt-4">
                    {others.map((entry, index) => (
                        <div key={entry.id} className="sky-card p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-300 w-4">{index + 4}</span>
                                <Avatar className="w-8 h-8 border border-slate-100">
                                    <AvatarImage src={entry.avatar_url || undefined} />
                                    <AvatarFallback>{entry.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-700">{entry.full_name}</p>
                                        <PlayerTraitTag wins={entry.wins} played={entry.gamesPlayed} score={entry.totalScore} />
                                    </div>
                                    <div className="flex gap-3 text-[10px] text-slate-400 font-bold uppercase">
                                        <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" /> {entry.gamesPlayed} Spiele</span>
                                        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {entry.totalScore} Pkt</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 font-black">
                                {entry.wins}
                                <Medal className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function PlayerTraitTag({ wins, played, score }: { wins: number, played: number, score: number }) {
    let trait = null
    const winRate = wins / played

    if (played >= 10 && winRate > 0.5) trait = { label: 'Dominator', color: 'bg-red-100 text-red-600 border-red-200' }
    else if (played >= 5 && wins === 0) trait = { label: 'Pechvogel', color: 'bg-slate-100 text-slate-600 border-slate-200' }
    else if (played >= 15) trait = { label: 'Urgestein', color: 'bg-blue-100 text-blue-600 border-blue-200' }
    else if (score / played > 100) trait = { label: 'Highscore-Jäger', color: 'bg-amber-100 text-amber-600 border-amber-200' }

    if (!trait) return null

    return (
        <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border", trait.color)}>
            {trait.label}
        </span>
    )
}

