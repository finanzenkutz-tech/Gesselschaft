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
}

interface GameSuggestionsProps {
    games: Game[]
    playerCount: number
}

export function GameSuggestions({ games, playerCount }: GameSuggestionsProps) {
    const [filter, setFilter] = useState<'all' | 'pileOfShame' | 'bestFit'>('bestFit')

    // Simple matching algorithm
    const getMatchScore = (game: Game) => {
        let score = 0
        if (game.is_unplayed) score += 5 // Pile of Shame priority
        // Complexity preference could be added here if we had a user setting
        return score
    }

    const filteredGames = games.filter(game => {
        if (filter === 'pileOfShame') return game.is_unplayed
        return true
    }).sort((a, b) => {
        if (filter === 'bestFit') {
            return getMatchScore(b) - getMatchScore(a)
        }
        return 0
    })

    return (
        <div className="sky-card p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Was spielen wir?
                    </h3>
                    <p className="text-slate-500 text-sm">Vorschläge basierend auf {playerCount} Spielern</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant={filter === 'bestFit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('bestFit')}
                    className="rounded-full text-xs"
                >
                    Top Treffer
                </Button>
                <Button
                    variant={filter === 'pileOfShame' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pileOfShame')}
                    className="rounded-full text-xs"
                >
                    Pile of Shame
                </Button>
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="rounded-full text-xs"
                >
                    Alle
                </Button>
            </div>

            <div className="space-y-3">
                {filteredGames.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Dice5 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Keine Spiele im Inventar der Gruppe gefunden.</p>
                    </div>
                ) : (
                    filteredGames.slice(0, 5).map(game => (
                        <div key={game.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                                {game.image_url ? (
                                    <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Dice5 className="w-6 h-6 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-slate-800 truncate">{game.name}</h4>
                                    {game.is_unplayed && (
                                        <span className="bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                                            Neu
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1" title="Besitzer">
                                        <User className="w-3 h-3" />
                                        {game.owner?.full_name || 'Unbekannt'}
                                    </span>
                                    {game.complexity && (
                                        <span className={cn(
                                            "flex items-center gap-1 font-bold",
                                            game.complexity > 3.5 ? "text-red-500" :
                                                game.complexity > 2.5 ? "text-yellow-600" : "text-green-500"
                                        )} title="Komplexität (1-5)">
                                            <BarChart className="w-3 h-3" />
                                            {game.complexity}
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
