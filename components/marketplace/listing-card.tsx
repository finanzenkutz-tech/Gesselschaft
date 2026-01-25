import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MapPin, Repeat, ShoppingBag, Store, MoreVertical, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { markAsReserved, markAsSold, deleteListing } from '@/app/(app)/marketplace/actions'

interface Listing {
    id: string
    title: string
    price: number | null
    description: string | null
    condition: string | null
    listing_type: 'sell' | 'trade' | 'both'
    location: string | null
    images: string[] | null
    status: 'active' | 'reserved' | 'sold'
    created_at: string
    is_for_rent?: boolean
    rental_period_days?: number | null
}

import { FavoriteButton } from '@/components/marketplace/favorite-button'

interface ListingCardProps {
    listing: Listing
    isFavorite?: boolean
    isOwner?: boolean
}

export function ListingCard({ listing, isFavorite = false, isOwner = false }: ListingCardProps) {
    const mainImage = listing.images && listing.images.length > 0 ? listing.images[0] : null

    const handleStatusChange = async (e: React.MouseEvent, status: 'reserved' | 'sold') => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const action = status === 'reserved' ? markAsReserved : markAsSold
            const result = await action(listing.id)
            if (result.success) {
                toast.success(`Status auf "${status === 'reserved' ? 'Reserviert' : 'Verkauft'}" gesetzt`)
            } else {
                toast.error(result.error || 'Fehler beim Aktualisieren')
            }
        } catch (error) {
            console.error(error)
            toast.error('Ein Fehler ist aufgetreten')
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('Möchtest du diese Anzeige wirklich löschen?')) return

        try {
            await deleteListing(listing.id)
            toast.success('Anzeige gelöscht')
        } catch (error) {
            console.error(error)
            toast.error('Fehler beim Löschen')
        }
    }

    return (
        <Link href={`/marketplace/${listing.id}`}>
            <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-500 group border-slate-100 flex flex-col bg-white/80 backdrop-blur-sm rounded-[2rem]">
                <div className="aspect-[5/4] relative bg-slate-50 overflow-hidden">
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <Store className="w-16 h-16 opacity-30" />
                        </div>
                    )}

                    {/* Type Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {listing.listing_type === 'sell' && (
                            <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-0 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                                Verkauf
                            </Badge>
                        )}
                        {listing.listing_type === 'trade' && (
                            <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white border-0 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                                Tausch
                            </Badge>
                        )}
                        {listing.listing_type === 'both' && (
                            <Badge className="bg-purple-500/90 hover:bg-purple-500 text-white border-0 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                                Mix
                            </Badge>
                        )}
                        {listing.is_for_rent && (
                            <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-0 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                                Verleih
                            </Badge>
                        )}
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {isOwner ? (
                            <div className="flex gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <Link href={`/marketplace/${listing.id}/edit`}>
                                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-white/90 shadow-xl backdrop-blur-md hover:bg-white text-slate-600">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Button onClick={handleDelete} variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-white/90 shadow-xl backdrop-blur-md hover:bg-white text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <FavoriteButton listingId={listing.id} initialIsFavorite={isFavorite} size="sm" className="h-9 w-9 bg-white/90 hover:bg-white backdrop-blur-md rounded-xl shadow-xl border-0" />
                            </div>
                        )}
                    </div>

                    {/* Status Overlay */}
                    {listing.status !== 'active' && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[2px] z-20">
                            <Badge className={`${listing.status === 'sold' ? 'bg-red-500' : 'bg-amber-500'} text-white px-6 py-2 text-sm font-black uppercase tracking-widest border-2 border-white/20 shadow-2xl`}>
                                {listing.status === 'sold' ? 'Gelöscht / Verkauft' : 'Reserviert'}
                            </Badge>
                        </div>
                    )}

                    {/* Price Tag */}
                    {listing.price !== null && (
                        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl z-10 border border-white/20">
                            <span className="text-xl font-black text-slate-900">
                                {listing.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    )}
                </div>

                <CardContent className="p-6 flex-1 space-y-4">
                    <div>
                        <h3 className="font-extrabold text-xl text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-2">
                            {listing.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400 px-2 py-0.5 rounded-md">
                                {getConditionLabel(listing.condition || 'good')}
                            </Badge>
                            {listing.is_for_rent && (
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">
                                    {listing.rental_period_days || 7} Tage Leihzeit
                                </span>
                            )}
                        </div>
                    </div>

                    {listing.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {listing.description}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="px-6 py-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            <MapPin className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 truncate max-w-[100px]">
                            {listing.location || 'Kein Ort'}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {new Date(listing.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                </CardFooter>
            </Card>
        </Link>
    )
}

function getConditionLabel(condition: string) {
    const labels: Record<string, string> = {
        'new': 'Neu',
        'like_new': 'Wie neu',
        'good': 'Gut',
        'acceptable': 'Akzeptabel',
        'poor': 'Schlecht'
    }
    return labels[condition] || condition
}

