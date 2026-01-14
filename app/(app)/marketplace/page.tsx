import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/marketplace/listing-card'
import { MarketplaceFilters } from '@/components/marketplace/marketplace-filters'
import { Button } from '@/components/ui/button'
import { Plus, Store, Heart, Package } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const resolvedSearchParams = await searchParams

    const { data: { user } } = await supabase.auth.getUser()

    // Parse search parameters
    const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
    const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : 'all'
    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'newest'
    const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : 'all'
    const condition = typeof resolvedSearchParams.condition === 'string' ? resolvedSearchParams.condition : 'all'

    // Location Params
    const lat = typeof resolvedSearchParams.lat === 'string' ? parseFloat(resolvedSearchParams.lat) : null
    const lng = typeof resolvedSearchParams.lng === 'string' ? parseFloat(resolvedSearchParams.lng) : null
    const radius = typeof resolvedSearchParams.radius === 'string' ? parseFloat(resolvedSearchParams.radius) : 50

    let query = supabase
        .from('marketplace_listings')
        .select('*, seller:profiles(*)')
        .eq('status', 'active') // Keep active status filter

    // Radius Search
    if (lat && lng) {
        const { data: nearbyIds, error: rpcError } = await supabase.rpc('get_listings_within_radius', {
            lat,
            lng,
            radius_km: radius
        })

        if (!rpcError && nearbyIds) {
            const ids = nearbyIds.map((i: any) => i.id)
            if (ids.length > 0) {
                query = query.in('id', ids)
            } else {
                // If radius finds nothing, return empty immediately or let query return empty
                query = query.in('id', ['00000000-0000-0000-0000-000000000000']) // Zero UUID to force empty
            }
        }
    }

    // Text search
    if (search) {
        query = query.ilike('title', `%${search}%`)
    }

    // Type filter
    if (type === 'sell') {
        query = query.in('listing_type', ['sell', 'both'])
    } else if (type === 'trade') {
        query = query.in('listing_type', ['trade', 'both'])
    }

    // Category filter
    if (category !== 'all') {
        query = query.eq('category', category)
    }

    // Condition filter
    if (condition !== 'all') {
        query = query.eq('condition', condition)
    }

    // Stats Filters
    if (typeof resolvedSearchParams.min_players === 'string') query = query.gte('max_players', parseInt(resolvedSearchParams.min_players))
    if (typeof resolvedSearchParams.max_players === 'string') query = query.lte('min_players', parseInt(resolvedSearchParams.max_players))
    if (typeof resolvedSearchParams.playtime === 'string') query = query.lte('playtime', parseInt(resolvedSearchParams.playtime)) // Max duration usually

    // Sort
    if (sort === 'price_asc') {
        query = query.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
        query = query.order('price', { ascending: false })
    } else {
        query = query.order('created_at', { ascending: false })
    }

    const { data: listings, error } = await query

    // Fetch user favorites
    let favoriteIds: string[] = []
    if (user) {
        const { data: favorites } = await supabase
            .from('marketplace_favorites')
            .select('listing_id')
            .eq('user_id', user.id)

        if (favorites) {
            favoriteIds = favorites.map(f => f.listing_id)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex justify-between items-center mb-8 w-full">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Marktplatz</h1>
                        <p className="text-slate-500">Kaufen, verkaufen und tauschen.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/marketplace/my-listings">
                            <Button variant="outline" className="gap-2">
                                <Package className="w-4 h-4" />
                                Meine Anzeigen
                            </Button>
                        </Link>
                        <Link href="/marketplace/favorites">
                            <Button variant="outline" className="gap-2">
                                <Heart className="w-4 h-4" />
                                Merkliste
                            </Button>
                        </Link>
                        <Link href="/marketplace/create">
                            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all">
                                <Plus className="w-4 h-4" />
                                Anzeige aufgeben
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <MarketplaceFilters />

            {!listings || listings.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Store className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Keine Angebote gefunden</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Es gibt aktuell keine Anzeigen, die deinen Kriterien entsprechen.
                        Sei der Erste und stelle ein Spiel ein!
                    </p>
                    <Link href="/marketplace/create" className="mt-6 inline-block">
                        <Button variant="outline">Anzeige erstellen</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            isFavorite={favoriteIds.includes(listing.id)}
                            isOwner={user?.id === listing.seller_id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
