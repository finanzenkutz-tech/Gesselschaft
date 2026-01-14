import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/marketplace/listing-card'
import { Button } from '@/components/ui/button'
import { Store, ArrowLeft, Heart } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: favorites } = await supabase
        .from('marketplace_favorites')
        .select(`
            listing_id,
            listing:marketplace_listings (
                *
            )
        `)
        .eq('user_id', user.id)

    // Extract listings and filter out nulls (if listing was deleted but fav remains - strict FK should prevent this but safer)
    const listings = favorites?.map(f => f.listing).filter(Boolean) || []

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                        <h1 className="text-3xl font-extrabold text-slate-800">Meine Merkliste</h1>
                    </div>
                    <p className="text-slate-500 text-lg">Anzeigen, die du dir gemerkt hast.</p>
                </div>

                <Link href="/marketplace">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück zum Marktplatz
                    </Button>
                </Link>
            </header>

            {!listings || listings.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Heart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Deine Merkliste ist leer</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Du hast dir noch keine Anzeigen gemerkt.
                        Stöbere im Marktplatz und klicke auf das Herz!
                    </p>
                    <Link href="/marketplace" className="mt-6 inline-block">
                        <Button>Zum Marktplatz</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((listing: any) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            isFavorite={true}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
