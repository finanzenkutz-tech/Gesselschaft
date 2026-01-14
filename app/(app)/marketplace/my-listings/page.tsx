import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/marketplace/listing-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { redirect } from 'next/navigation'
import { Package, Clock, CheckCircle2 } from 'lucide-react'

export default async function MyListingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

    const activeListings = listings?.filter(l => l.status === 'active') || []
    const reservedListings = listings?.filter(l => l.status === 'reserved') || []
    const soldListings = listings?.filter(l => l.status === 'sold') || []

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                Meine Anzeigen
            </h1>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="active" className="gap-2">
                        <Package className="w-4 h-4" />
                        Aktiv ({activeListings.length})
                    </TabsTrigger>
                    <TabsTrigger value="reserved" className="gap-2">
                        <Clock className="w-4 h-4" />
                        Reserviert ({reservedListings.length})
                    </TabsTrigger>
                    <TabsTrigger value="sold" className="gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Verkauft ({soldListings.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeListings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Keine aktiven Anzeigen.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {activeListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} isOwner />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="reserved" className="space-y-4">
                    {reservedListings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Keine reservierten Anzeigen.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {reservedListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} isOwner />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sold" className="space-y-4">
                    {soldListings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Keine verkauften Anzeigen.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {soldListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} isOwner />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
