'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Euro, Check, X, MessageSquare, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { updateOfferStatus } from '@/app/(app)/marketplace/actions'

interface Offer {
    id: string
    amount: number
    message: string | null
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
    created_at: string
    is_rental_request?: boolean
    return_date?: string | null
    buyer: {
        full_name: string | null
    } | null
}

interface OffersReceivedProps {
    offers: Offer[]
    isOwner: boolean
}

export function OffersReceived({ offers, isOwner }: OffersReceivedProps) {
    const [localOffers, setLocalOffers] = useState(offers)

    const handleStatusUpdate = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
        try {
            const res = await updateOfferStatus(offerId, newStatus)
            if (res.success) {
                toast.success(`Angebot ${newStatus === 'accepted' ? 'angenommen' : 'abgelehnt'}`)
                setLocalOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: newStatus } : o))
            } else {
                toast.error(res.error || 'Fehler beim Aktualisieren')
            }
        } catch (error) {
            toast.error('Ein Fehler ist aufgetreten')
        }
    }

    if (!isOwner || offers.length === 0) return null

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Empfangene Preisvorschläge ({offers.length})
            </h3>
            <div className="space-y-3">
                {localOffers.map((offer) => (
                    <Card key={offer.id} className={`overflow-hidden border-slate-200 ${offer.status === 'accepted' ? 'bg-green-50 border-green-200' : ''}`}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{offer.amount.toFixed(2)} €</span>
                                        <Badge variant={
                                            offer.status === 'accepted' ? 'default' :
                                                offer.status === 'rejected' ? 'destructive' :
                                                    offer.status === 'cancelled' ? 'outline' : 'secondary'
                                        } className={offer.status === 'accepted' ? 'bg-green-600' : ''}>
                                            {offer.status === 'pending' ? 'Ausstehend' :
                                                offer.status === 'accepted' ? 'Angenommen' :
                                                    offer.status === 'rejected' ? 'Abgelehnt' : 'Storniert'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(offer.created_at).toLocaleDateString('de-DE')} von {offer.buyer?.full_name || 'Unbekannt'}
                                    </p>
                                    {offer.is_rental_request && offer.return_date && (
                                        <p className="text-xs font-bold text-orange-600 mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Rückgabe bis: {new Date(offer.return_date).toLocaleDateString('de-DE')}
                                        </p>
                                    )}
                                </div>
                                {offer.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleStatusUpdate(offer.id, 'rejected')}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStatusUpdate(offer.id, 'accepted')}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {offer.message && (
                                <div className="bg-white/50 p-2 rounded text-sm text-slate-700 mt-2 flex gap-2">
                                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <p className="italic">{offer.message}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

