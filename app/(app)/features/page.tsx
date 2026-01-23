import { FeaturesList } from '@/components/features/features-list'
import { getFeatureRequests } from '@/app/features/actions'
import { FeatureRequestForm } from '@/components/features/feature-request-form'
import { createClient } from '@/lib/supabase/server'
import { Sparkles, TrendingUp } from 'lucide-react'

export default async function FeaturesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', user?.id).single()
    const isSuperAdmin = profile?.system_role === 'super_admin'

    const features = await getFeatureRequests()
    const totalVotes = features?.reduce((acc: any, f: any) => acc + (f.votes || 0), 0) || 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-yellow-500" />
                        Feature Wünsche
                    </h1>
                    <p className="text-slate-500 text-lg mt-1">Schlage neue Funktionen vor und stimme für deine Favoriten!</p>
                </div>

                <FeatureRequestForm />
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sky-card p-6 text-center">
                    <p className="text-3xl font-extrabold text-primary">{features.length}</p>
                    <p className="text-sm text-slate-500 font-bold">Ideen</p>
                </div>
                <div className="sky-card p-6 text-center">
                    <p className="text-3xl font-extrabold text-green-500">{totalVotes}</p>
                    <p className="text-sm text-slate-500 font-bold">Stimmen</p>
                </div>
                <div className="sky-card p-6 text-center flex flex-col items-center justify-center gap-1 col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                        Beliebteste
                    </div>
                    <p className="text-primary font-bold truncate max-w-full px-2">
                        {features[0]?.title || 'Noch keine'}
                    </p>
                </div>
            </div>

            <FeaturesList
                initialFeatures={features}
                currentUserId={user?.id || null}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    )
}
