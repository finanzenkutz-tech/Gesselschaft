'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2 } from 'lucide-react'
import { createReview } from '@/app/marketplace/actions'
import { cn } from '@/lib/utils'

interface RateSellerDialogProps {
    sellerId: string
    sellerName: string
}

export function RateSellerDialog({ sellerId, sellerName }: RateSellerDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) return

        setIsLoading(true)
        const res = await createReview(sellerId, rating, comment)
        setIsLoading(false)

        if (res.success) {
            setIsOpen(false)
            alert('Danke für deine Bewertung!')
            setRating(0)
            setComment('')
        } else {
            alert('Fehler: ' + res.error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto text-xs h-7">
                    Bewerten
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Verkäufer bewerten</DialogTitle>
                    <DialogDescription>
                        Wie war deine Erfahrung mit <span className="font-bold text-slate-900">{sellerName}</span>?
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8 transition-colors",
                                            (hoverRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            {rating === 1 ? 'Ungenügend' :
                                rating === 2 ? 'Akzeptabel' :
                                    rating === 3 ? 'Gut' :
                                        rating === 4 ? 'Sehr gut' :
                                            rating === 5 ? 'Exzellent' : 'Wähle eine Bewertung'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Kommentar (Optional)</Label>
                        <Textarea
                            placeholder="Hat alles geklappt? War der Zustand wie beschrieben?"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={isLoading || rating === 0}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Bewertung abgeben
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
