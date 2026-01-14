import { ListingForm } from '@/components/marketplace/listing-form'
import { createClient } from '@/lib/supabase/server'

export default async function CreateListingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch user's inventory to allow selecting games
    const { data: inventory } = await supabase
        .from('inventory')
        .select('id, name, image_url, complexity')
        .eq('owner_id', user?.id)
        .order('name')

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800">Anzeige erstellen</h1>
                <p className="text-slate-500 text-lg">Biete deine Spiele zum Verkauf oder Tausch an.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <ListingForm inventory={inventory || []} />
            </div>
        </div>
    )
}
