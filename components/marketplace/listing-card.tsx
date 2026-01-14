import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MapPin, Repeat, ShoppingBag, Image as ImageIcon, MoreVertical, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { markAsReserved, markAsSold, deleteListing } from '@/app/marketplace/actions'

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
            <Card className="h-full overflow-hidden hover:shadow-lg transition-all group border-slate-200 flex flex-col">
                <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-12 h-12 opacity-50" />
                        </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                        {isOwner ? (
                            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <Link href={`/marketplace/${listing.id}/edit`}>
                                            <DropdownMenuItem>
                                                <Edit className="w-4 h-4 mr-2" /> Bearbeiten
                                            </DropdownMenuItem>
                                        </Link>
                                        {listing.status === 'active' && (
                                            <>
                                                <DropdownMenuItem onClick={(e) => handleStatusChange(e, 'reserved')}>
                                                    <Clock className="w-4 h-4 mr-2" /> Reservieren
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleStatusChange(e, 'sold')}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Als Verkauft markieren
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {listing.status === 'reserved' && (
                                            <DropdownMenuItem onClick={(e) => handleStatusChange(e, 'sold')}>
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Als Verkauft markieren
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <Trash2 className="w-4 h-4 mr-2" /> Löschen
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <FavoriteButton listingId={listing.id} initialIsFavorite={isFavorite} size="sm" className="bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-sm" />
                            </div>
                        )}

                        {(listing.listing_type === 'sell' || listing.listing_type === 'both') && (
                            <Badge variant="secondary" className="bg-white/90 text-green-700 shadow-sm backdrop-blur-sm h-8 px-3">
                                <ShoppingBag className="w-3 h-3 mr-1" />
                                {listing.price ? `${listing.price.toFixed(2)} €` : 'Verkauf'}
                            </Badge>
                        )}
                        {(listing.listing_type === 'trade' || listing.listing_type === 'both') && (
                            <Badge variant="secondary" className="bg-white/90 text-blue-700 shadow-sm backdrop-blur-sm h-8 px-3">
                                <Repeat className="w-3 h-3 mr-1" />
                                Tausch
                            </Badge>
                        )}
                    </div>

                    {listing.status !== 'active' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                            <Badge className={`${listing.status === 'sold' ? 'bg-red-500' : 'bg-amber-500'} text-white px-3 py-1 text-lg font-bold uppercase tracking-wider`}>
                                {listing.status === 'sold' ? 'Verkauft' : 'Reserviert'}
                            </Badge>
                        </div>
                    )}
                </div>

                <CardContent className="p-4 flex-1">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        {listing.condition && (
                            <Badge variant="outline" className="text-xs font-normal border-slate-200 text-slate-500">
                                {getConditionLabel(listing.condition)}
                            </Badge>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex justify-between items-center text-slate-400 text-xs">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{listing.location || 'Kein Ort'}</span>
                    </div>
                    <span>{new Date(listing.created_at).toLocaleDateString('de-DE')}</span>
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
