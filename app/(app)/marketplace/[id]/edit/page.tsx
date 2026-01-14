import { createClient } from '@/lib/supabase/server'
import { ListingForm } from '@/components/marketplace/listing-form'
import { notFound, redirect } from 'next/navigation'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .single()

    if (!listing) notFound()

    if (listing.seller_id !== user.id) {
        // Only owner can edit
        redirect(`/marketplace/${id}`)
    }

    // Fetch inventory for dropdown
    const { data: inventory } = await supabase
        .from('inventory')
        .select('id, name, image_url, complexity')
        .eq('owner_id', user.id)
        .order('name')

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800">Anzeige bearbeiten</h1>
                <p className="text-slate-500 text-lg">Aktualisiere die Details deines Angebots.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <ListingForm inventory={inventory || []} initialData={listing} />
            </div>
        </div>
    )
}
