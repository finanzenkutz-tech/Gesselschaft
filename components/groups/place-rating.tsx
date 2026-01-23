'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2, MessageSquare } from 'lucide-react'
import { ratePlace, getPlaceRatings } from '@/app/groups/place-rating-actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PlaceRating({ placeId, currentUserId }: { placeId: string, currentUserId?: string }) {
    const [ratings, setRatings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [userRating, setUserRating] = useState<number>(0)
    const [hoverRating, setHoverRating] = useState<number>(0)

    useEffect(() => {
        async function fetchRatings() {
            const data = await getPlaceRatings(placeId)
            setRatings(data)
            if (currentUserId) {
                const myRating = data.find(r => r.user_id === currentUserId)
                if (myRating) setUserRating(myRating.rating)
            }
            setLoading(false)
        }
        fetchRatings()
    }, [placeId, currentUserId])

    async function handleRate(rating: number) {
        if (!currentUserId) return
        setSubmitting(true)
        const result = await ratePlace(placeId, rating)
        if (result.success) {
            setUserRating(rating)
            // Refresh ratings
            const data = await getPlaceRatings(placeId)
            setRatings(data)
        }
        setSubmitting(false)
    }

    const averageRating = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        : 0

    return (
        <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-4 h-4 transition-all cursor-pointer",
                                    (hoverRating || userRating || averageRating) >= star
                                        ? "text-yellow-400 fill-yellow-400 scale-110"
                                        : "text-slate-200 fill-slate-100"
                                )}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => handleRate(star)}
                            />
                        ))}
                    </div>
                    {averageRating > 0 && (
                        <span className="text-xs font-bold text-slate-500">
                            {averageRating.toFixed(1)} ({ratings.length})
                        </span>
                    )}
                </div>

                {submitting && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            </div>

            {ratings.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 no-scrollbar">
                    {ratings.map(r => (
                        <div key={r.id} className="flex gap-2 items-start bg-slate-50/50 p-2 rounded-xl text-[11px] border border-slate-100/50">
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                                {r.user?.avatar_url ? (
                                    <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[8px] font-bold text-slate-400">{r.user?.full_name?.[0]}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-700 truncate">{r.user?.full_name}</span>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className={cn("w-2.5 h-2.5", s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200")} />
                                        ))}
                                    </div>
                                </div>
                                {r.comment && <p className="text-slate-500 mt-0.5 line-clamp-2">{r.comment}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
