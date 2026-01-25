'use client'

import { useState } from 'react'
import { Star, ThumbsUp, Zap, Clock3, MessageSquareQuote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'
import { voteReviewHelpful } from '@/app/(app)/groups/game-actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Review {
    id: string
    game_name: string
    user_id: string
    rating: number
    complexity_rating: number
    duration_minutes: number
    comment: string
    created_at: string
    profiles: {
        full_name: string
        avatar_url: string
    }
    game_review_votes: { user_id: string }[]
}

interface GroupReviewsWidgetProps {
    reviews: Review[]
    currentUserId?: string
}

export function GroupReviewsWidget({ reviews, currentUserId }: GroupReviewsWidgetProps) {
    const [localReviews, setLocalReviews] = useState(reviews)

    const handleVote = async (reviewId: string) => {
        if (!currentUserId) return toast.error("Bitte einloggen")

        try {
            const result = await voteReviewHelpful(reviewId)

            // Update local state
            setLocalReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    const newVotes = result.action === 'added'
                        ? [...r.game_review_votes, { user_id: currentUserId }]
                        : r.game_review_votes.filter(v => v.user_id !== currentUserId)
                    return { ...r, game_review_votes: newVotes }
                }
                return r
            }))
        } catch (err) {
            toast.error("Votum fehlgeschlagen")
        }
    }

    if (localReviews.length === 0) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <MessageSquareQuote className="w-6 h-6 text-primary" />
                    Gruppen-Rezensionen
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neueste Eindrücke</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {localReviews.slice(0, 3).map((review) => {
                    const hasVoted = review.game_review_votes.some(v => v.user_id === currentUserId)

                    return (
                        <div key={review.id} className="sky-card p-6 border-slate-100 hover:border-primary/20 transition-all group">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                        <AvatarImage src={review.profiles.avatar_url} />
                                        <AvatarFallback>{review.profiles.full_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm leading-none">{review.profiles.full_name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: de })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-100">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        <span className="text-xs font-black text-amber-700">{review.rating}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-black text-lg text-primary group-hover:underline cursor-pointer">
                                    {review.game_name}
                                </h4>
                                {review.comment && (
                                    <p className="mt-2 text-slate-600 font-medium text-sm italic leading-relaxed">
                                        "{review.comment}"
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5" title="Anspruch">
                                        <Zap className={cn("w-3.5 h-3.5", review.complexity_rating > 0 ? "text-purple-500" : "text-slate-200")} />
                                        <span className="text-[10px] font-black text-slate-500">{review.complexity_rating}/5</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Dauer">
                                        <Clock3 className={cn("w-3.5 h-3.5", review.duration_minutes > 0 ? "text-blue-500" : "text-slate-200")} />
                                        <span className="text-[10px] font-black text-slate-500">{review.duration_minutes}/5</span>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVote(review.id)}
                                    className={cn(
                                        "h-8 rounded-full gap-2 transition-all",
                                        hasVoted ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-primary hover:bg-primary/5"
                                    )}
                                >
                                    <ThumbsUp className={cn("w-3.5 h-3.5", hasVoted && "fill-primary")} />
                                    <span className="text-[10px] font-bold">{review.game_review_votes.length} Hilfreich</span>
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

