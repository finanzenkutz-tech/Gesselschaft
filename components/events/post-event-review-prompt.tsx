'use client'

import { useState } from 'react'
import { Star, MessageSquarePlus, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logGameSession } from '@/app/(app)/groups/game-actions'
import { toast } from 'sonner'

interface PostEventReviewPromptProps {
    eventId: string
    groupId: string
    gamesToReview: { name: string, imageUrl?: string }[]
}

export function PostEventReviewPrompt({ eventId, groupId, gamesToReview }: PostEventReviewPromptProps) {
    const [reviews, setReviews] = useState<Record<string, { rating: number, comment: string }>>({})
    const [completed, setCompleted] = useState<string[]>([])
    const [loading, setLoading] = useState<string | null>(null)
    const [show, setShow] = useState(true)

    if (!show || gamesToReview.length === 0 || completed.length === gamesToReview.length) return null

    const handleReview = async (gameName: string) => {
        const review = reviews[gameName]
        if (!review?.rating) {
            toast.error("Bitte gib eine Bewertung ab")
            return
        }

        setLoading(gameName)
        try {
            await logGameSession({
                groupId,
                gameName,
                playedAt: new Date().toISOString(),
                playerIds: [], // We only care about the review part in logGameSession for this context
                rating: review.rating,
                comment: review.comment
            })
            setCompleted(prev => [...prev, gameName])
            toast.success("Bewertung gespeichert!")
        } catch (err) {
            toast.error("Fehler beim Speichern")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
                <button
                    onClick={() => setShow(false)}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Schließen"
                    aria-label="Schließen"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                    <Star className="w-10 h-10 text-yellow-300 fill-yellow-300 animate-bounce-slow" />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-black mb-2 tracking-tight">Wie war der Spieleabend?</h2>
                    <p className="text-indigo-100 font-medium">Bewerte die gespielten Spiele, um eure Hub-Statistiken zu verbessern!</p>
                </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gamesToReview.filter(g => !completed.includes(g.name)).map((game) => (
                    <div key={game.name} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 space-y-4 hover:bg-white/15 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center">
                                {game.imageUrl ? <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" /> : <Star className="w-5 h-5 opacity-40" />}
                            </div>
                            <h3 className="font-bold truncate">{game.name}</h3>
                        </div>

                        <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setReviews(prev => ({ ...prev, [game.name]: { ...prev[game.name], rating: s } }))}
                                    className="p-1 transition-transform hover:scale-125"
                                    title={`${s} Sterne`}
                                    aria-label={`${s} Sterne vergeben`}
                                >
                                    <Star className={`w-6 h-6 ${reviews[game.name]?.rating >= s ? 'text-yellow-300 fill-yellow-300' : 'text-white/20'}`} />
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            placeholder="Kurzes Feedback..."
                            className="w-full bg-white/10 border-none rounded-xl px-4 py-2 text-xs placeholder:text-white/40 focus:ring-2 focus:ring-white/30 transition-all font-medium"
                            value={reviews[game.name]?.comment || ''}
                            onChange={(e) => setReviews(prev => ({ ...prev, [game.name]: { ...prev[game.name], comment: e.target.value } }))}
                        />

                        <Button
                            onClick={() => handleReview(game.name)}
                            disabled={loading === game.name}
                            className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-xl h-10 shadow-lg shadow-indigo-900/20"
                        >
                            {loading === game.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Abschicken
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

