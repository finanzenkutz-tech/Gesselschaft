'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Star, Plus, Trash2, Heart, Search, Dice5 } from 'lucide-react'
import { addGameToWishlist, toggleVoteForGame, deleteWish } from '@/app/(app)/groups/wishlist-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GroupWishlistProps {
    groupId: string
    wishlist: any[]
    userId?: string
    isAdmin?: boolean
}

export function GroupWishlist({ groupId, wishlist, userId, isAdmin }: GroupWishlistProps) {
    const [newGame, setNewGame] = useState('')
    const [loading, setLoading] = useState(false)

    const handleAdd = async () => {
        if (!newGame.trim()) return
        setLoading(true)
        try {
            await addGameToWishlist(groupId, newGame)
            setNewGame('')
            toast.success('Zum Wunschzettel hinzugefügt!')
        } catch (e: any) {
            toast.error(e.message || 'Fehler beim Hinzufügen')
        } finally {
            setLoading(false)
        }
    }

    const handleVote = async (itemId: string) => {
        if (!userId) return toast.error('Bitte einloggen')
        try {
            await toggleVoteForGame(itemId)
        } catch (e) {
            toast.error('Fehler beim Voten')
        }
    }

    const handleDelete = async (itemId: string) => {
        if (!confirm('Diesen Wunsch wirklich löschen?')) return
        try {
            await deleteWish(itemId, groupId)
            toast.success('Wunsch entfernt')
        } catch (e) {
            toast.error('Fehler beim Löschen')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                    Gruppen-Wunschliste
                </h2>
                <div className="flex gap-2">
                    <Input
                        placeholder="Spielname..."
                        value={newGame}
                        onChange={(e) => setNewGame(e.target.value)}
                        className="h-10 rounded-xl bg-white border-slate-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={loading} size="sm" className="rounded-xl h-10 px-4">
                        <Plus className="w-4 h-4 mr-2" /> Hinzufügen
                    </Button>
                </div>
            </div>

            {wishlist.length === 0 ? (
                <div className="sky-card p-12 text-center text-slate-400 border-dashed border-2 bg-slate-50/30">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-10" />
                    <p className="font-bold">Noch keine Wünsche. Welches Spiel fehlt euch?</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist
                        .sort((a, b) => b.vote_count - a.vote_count)
                        .map((item) => {
                            const hasVoted = item.group_game_wish_votes?.some((v: any) => v.user_id === userId)
                            return (
                                <div key={item.id} className="sky-card p-4 flex items-center justify-between group bg-white/50 backdrop-blur-sm border-slate-100 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Dice5 className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-black text-slate-800 truncate" title={item.game_name}>{item.game_name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                Von {item.profiles?.full_name?.split(' ')[0] || 'Unbekannt'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleVote(item.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all border",
                                                hasVoted
                                                    ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200"
                                                    : "bg-white text-slate-400 border-slate-100 hover:border-rose-300 hover:text-rose-500"
                                            )}
                                        >
                                            <Heart className={cn("w-4 h-4", hasVoted ? "fill-white" : "")} />
                                            <span className="text-[10px] font-black">{item.vote_count}</span>
                                        </button>
                                        {(isAdmin || item.user_id === userId) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                </div>
            )}
        </div>
    )
}

