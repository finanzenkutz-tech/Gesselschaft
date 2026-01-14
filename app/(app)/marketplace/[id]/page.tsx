import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, User, ShoppingBag, Repeat, ArrowLeft, Send, Trash2, CheckCircle, AlertCircle, Edit } from 'lucide-react'
import Link from 'next/link'
import { deleteListing, markAsSold } from '@/app/marketplace/actions'
import { ContactSellerButton } from '@/components/marketplace/contact-seller-button'
import { FavoriteButton } from '@/components/marketplace/favorite-button'
import { ReportDialog } from '@/components/marketplace/report-dialog'
import { RateSellerDialog } from '@/components/marketplace/rate-seller-dialog'

export const dynamic = 'force-dynamic'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('*, seller:profiles(id, full_name, avatar_url, email)')
        .eq('id', id)
        .single()

    if (!listing) {
        notFound()
    }

    const isOwner = user?.id === listing.seller_id

    // Check favorite status
    let isFavorite = false
    if (user) {
        const { data: fav } = await supabase
            .from('marketplace_favorites')
            .select('listing_id')
            .eq('user_id', user.id)
            .eq('listing_id', listing.id)
            .single()
        if (fav) isFavorite = true
    }

    return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
            <Link href="/marketplace" className="inline-flex items-center text-slate-500 hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zum Marktplatz
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Images Section */}
                <div className="space-y-4">
                    <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
                        {listing.images && listing.images.length > 0 ? (
                            <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                <span className="flex flex-col items-center gap-2">
                                    <ShoppingBag className="w-12 h-12 opacity-50" />
                                    No Image
                                </span>
                            </div>
                        )}

                        <div className="absolute top-4 right-4 z-10">
                            <FavoriteButton listingId={listing.id} initialIsFavorite={isFavorite} className="bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg h-12 w-12" />
                        </div>

                        {listing.status !== 'active' && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                <Badge className={`${listing.status === 'sold' ? 'bg-red-500' : 'bg-amber-500'} text-white px-6 py-2 text-xl font-bold uppercase tracking-wider shadow-lg`}>
                                    {listing.status === 'sold' ? 'Verkauft' : 'Reserviert'}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {listing.images && listing.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {listing.images.slice(1).map((img: string, i: number) => (
                                <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-primary transition-colors">
                                    <img src={img} alt={`View ${i}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="space-y-8">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {listing.listing_type === 'sell' || listing.listing_type === 'both' ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                    <ShoppingBag className="w-3 h-3 mr-1" /> Verkauf
                                </Badge>
                            ) : null}
                            {listing.listing_type === 'trade' || listing.listing_type === 'both' ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                    <Repeat className="w-3 h-3 mr-1" /> Tausch
                                </Badge>
                            ) : null}
                            <Badge variant="outline" className="text-slate-500 border-slate-300">
                                {listing.condition === 'new' ? 'Neu & OVP' :
                                    listing.condition === 'like_new' ? 'Wie neu' :
                                        listing.condition === 'good' ? 'Gut' :
                                            listing.condition === 'acceptable' ? 'Akzeptabel' : 'Stark gebraucht'}
                            </Badge>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 leading-tight">
                            {listing.title}
                        </h1>

                        {(listing.listing_type === 'sell' || listing.listing_type === 'both') && listing.price && (
                            <div className="text-3xl font-bold text-primary mb-4">
                                {listing.price.toFixed(2)} €
                            </div>
                        )}

                        <div className="flex items-center text-slate-500 mb-6 font-medium">
                            <MapPin className="w-4 h-4 mr-2" />
                            {listing.location || 'Kein Standort angegeben'}
                            <span className="mx-2">•</span>
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(listing.created_at).toLocaleDateString()}
                        </div>

                        <div className="prose prose-slate max-w-none mb-8 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Beschreibung</h3>
                            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                {listing.description || 'Keine Beschreibung verfügbar.'}
                            </p>
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                {listing.seller?.avatar_url ? (
                                    <img src={listing.seller.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    listing.seller?.full_name?.[0] || 'U'
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                                    Verkäufer
                                    {!isOwner && (
                                        <RateSellerDialog sellerId={listing.seller_id} sellerName={listing.seller?.full_name || 'Verkäufer'} />
                                    )}
                                </p>
                                <p className="font-bold text-lg text-slate-800">{listing.seller?.full_name || 'Unbekannt'}</p>
                            </div>
                        </div>

                        {!isOwner && listing.seller?.email && (
                            <ContactSellerButton
                                listingId={listing.id}
                                sellerId={listing.seller_id}
                                sellerName={listing.seller.full_name || 'dem Verkäufer'}
                                isOwner={isOwner}
                            />
                        )}
                        {!isOwner && !listing.seller?.email && (
                            <div className="text-center p-3 bg-slate-50 rounded-lg text-slate-500 text-sm">
                                Keine Kontaktinformationen verfügbar.
                            </div>
                        )}
                        {!isOwner && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <ReportDialog listingId={listing.id} />
                            </div>
                        )}
                    </div>

                    {/* Owner Actions */}
                    {isOwner && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Anzeige verwalten
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Button variant="outline" className="w-full justify-start border-slate-300" asChild>
                                    <Link href={`/marketplace/${listing.id}/edit`}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Bearbeiten
                                    </Link>
                                </Button>
                                {listing.status === 'active' && (
                                    <form action={async () => { 'use server'; await markAsSold(listing.id) }}>
                                        <Button variant="secondary" className="w-full justify-start text-green-700 bg-green-100 hover:bg-green-200 border border-green-200">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Als verkauft markieren
                                        </Button>
                                    </form>
                                )}
                                <form action={async () => { 'use server'; await deleteListing(listing.id) }}>
                                    <Button variant="secondary" className="w-full justify-start text-red-600 bg-red-50 hover:bg-red-100 border border-red-200">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Anzeige löschen
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
