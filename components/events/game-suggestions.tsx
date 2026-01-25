'use client'

import { useState } from 'react'
import { Dice5, AlertCircle, Sparkles, User, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Game {
    id: string
    name: string
    is_unplayed: boolean
    complexity: number
    image_url: string | null
    owner: {
        full_name: string
    }
    score?: number
    historyCount?: number
    lastMood?: string
}

interface GameSuggestionsProps {
    games: Game[]
    playerCount: number
}

export function GameSuggestions({ games, playerCount }: GameSuggestionsProps) {
    const [filter, setFilter] = useState<'all' | 'pileOfShame' | 'bestFit'>('bestFit')

    const filteredGames = games.filter(game => {
        if (filter === 'pileOfShame') return game.is_unplayed
        return true
    }).sort((a, b) => {
        if (filter === 'bestFit') {
            return (b.score || 0) - (a.score || 0)
        }
        return 0
    })

    return (
        <div className="sky-card p-6 space-y-6 bg-gradient-to-br from-white to-amber-50/20 border-amber-100/50">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        Smart Recommendations
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">Was eure Gruppe heute lieben würde</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant={filter === 'bestFit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('bestFit')}
                    className={cn("rounded-full text-xs font-bold transition-all", filter === 'bestFit' && "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-100")}
                >
                    Top Treffer
                </Button>
                <Button
                    variant={filter === 'pileOfShame' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pileOfShame')}
                    className="rounded-full text-xs font-bold"
                >
                    Pile of Shame
                </Button>
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="rounded-full text-xs font-bold"
                >
                    Alle
                </Button>
            </div>

            <div className="space-y-4">
                {filteredGames.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Dice5 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Keine passenden Spiele gefunden.</p>
                    </div>
                ) : (
                    filteredGames.slice(0, 5).map((game, idx) => (
                        <div key={game.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 transition-all group hover:shadow-lg hover:shadow-amber-100/20 relative overflow-hidden">
                            {idx === 0 && filter === 'bestFit' && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
                                    Heißester Tipp
                                </div>
                            )}

                            <div className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                                {game.image_url ? (
                                    <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Dice5 className="w-6 h-6 text-slate-300" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">{game.name}</h4>
                                    {game.is_unplayed && (
                                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                                            Neu
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                        <User className="w-3 h-3 text-slate-400" />
                                        {game.owner?.full_name || 'Unbekannt'}
                                    </span>
                                    {game.historyCount && game.historyCount > 0 && (
                                        <span className="text-amber-600 flex items-center gap-1">
                                            {game.historyCount}x gespielt
                                            {game.lastMood && <span className="p-1 bg-amber-50 rounded-lg">{game.lastMood}</span>}
                                        </span>
                                    )}
                                    {game.complexity && (
                                        <span className={cn(
                                            "flex items-center gap-1",
                                            game.complexity > 3.5 ? "text-red-500" :
                                                game.complexity > 2.5 ? "text-yellow-600" : "text-green-500"
                                        )}>
                                            <BarChart className="w-3 h-3" />
                                            Lvl {game.complexity}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
