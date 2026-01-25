'use client'

import { useState } from 'react'
import { Heart, Trash2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addWish, removeWish } from '@/app/(app)/events/feature-actions'

interface EventWishesWidgetProps {
    eventId: string
    wishes: any[]
    availableGames: any[]
    userId: string | undefined
}

export function EventWishesWidget({ eventId, wishes, availableGames, userId }: EventWishesWidgetProps) {
    const [selectedGame, setSelectedGame] = useState('')
    const [loading, setLoading] = useState(false)

    // Filter out games that are already wished for? Or allow multiple votes?
    // Current logic: One wish per user per game.
    // If other user wished it, I can also wish it (voting system).
    // The select list should arguably show all available games.

    // Group wishes by game to show vote counts
    const wishCounts = wishes.reduce((acc, wish) => {
        const gameId = wish.inventory_id
        if (!acc[gameId]) {
            acc[gameId] = {
                game: wish.inventory,
                count: 0,
                wishers: [],
                myWishId: null
            }
        }
        acc[gameId].count++
        acc[gameId].wishers.push(wish.profiles.full_name)
        if (wish.user_id === userId) {
            acc[gameId].myWishId = wish.id
        }
        return acc
    }, {} as Record<string, any>)

    const sortedWishes = Object.values(wishCounts).sort((a: any, b: any) => b.count - a.count)

    async function handleAdd() {
        if (!selectedGame) return
        setLoading(true)
        await addWish(eventId, selectedGame)
        setSelectedGame('')
        setLoading(false)
    }

    async function handleRemove(id: string) {
        if (!confirm('Wunsch entfernen?')) return
        await removeWish(id, eventId)
    }

    return (
        <div className="sky-card p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-500" />
                Spielwünsche
            </h3>

            <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex gap-2">
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                    <SelectTrigger className="bg-white rounded-xl shadow-sm border-pink-200">
                        <SelectValue placeholder="Was möchtest du spielen?" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableGames.length > 0 ? (
                            availableGames.map(game => (
                                <SelectItem key={game.id} value={game.id}>
                                    {game.name} ({game.owner?.full_name})
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-slate-500">Keine Spiele verfügbar.</div>
                        )}
                    </SelectContent>
                </Select>
                <Button
                    onClick={handleAdd}
                    disabled={loading || !selectedGame}
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-lg shadow-pink-100"
                >
                    <Heart className="w-4 h-4 mr-2" />
                    Wünschen
                </Button>
            </div>

            <div className="space-y-3">
                {sortedWishes.length === 0 && <p className="text-center text-slate-400 italic py-4">Noch keine Wünsche.</p>}

                {sortedWishes.map((item: any) => (
                    <div key={item.game.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-500 flex flex-col items-center justify-center border border-pink-100">
                                <span className="text-lg font-bold">{item.count}</span>
                                <Heart className="w-3 h-3 fill-pink-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{item.game.name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                    Gewünscht von: {item.wishers.join(', ')}
                                </p>
                            </div>
                        </div>

                        {item.myWishId ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(item.myWishId)}
                                className="text-pink-300 hover:text-red-500 hover:bg-red-50"
                                title="Wunsch entfernen"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    addWish(eventId, item.game.id) // Optimistic update would be nice but server action is fast enough
                                }}
                                className="text-slate-300 hover:text-pink-500 hover:bg-pink-50"
                                title="Auch wünschen"
                            >
                                <Heart className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

