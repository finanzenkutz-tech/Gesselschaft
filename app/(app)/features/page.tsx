import { Lightbulb, ThumbsUp, TrendingUp, Sparkles } from 'lucide-react'
import { getFeatureRequests } from '@/app/features/actions'
import { FeatureRequestForm } from '@/components/features/feature-request-form'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function FeaturesPage() {
    const features = await getFeatureRequests()

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sky-card p-6 text-center">
                    <p className="text-3xl font-extrabold text-primary">{features.length}</p>
                    <p className="text-sm text-slate-500 font-bold">Ideen</p>
                </div>
                <div className="sky-card p-6 text-center">
                    <p className="text-3xl font-extrabold text-green-500">{features.reduce((acc, f) => acc + (f.votes || 0), 0)}</p>
                    <p className="text-sm text-slate-500 font-bold">Stimmen</p>
                </div>
                <div className="sky-card p-6 text-center col-span-2 flex items-center justify-center gap-3">
                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                    <p className="text-slate-600 font-bold">Beliebteste Idee: <span className="text-primary">{features[0]?.title || 'Noch keine'}</span></p>
                </div>
            </div>

            {/* Feature List */}
            {features.length === 0 ? (
                <div className="sky-card p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-3xl flex items-center justify-center mb-6">
                        <Lightbulb className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Keine Ideen vorhanden</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        Sei der Erste, der eine neue Funktion vorschlägt!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {features.map((feature, idx) => (
                        <div key={feature.id} className="sky-card p-6 flex items-center gap-6 group hover:border-primary/20 hover:shadow-xl transition-all">
                            {/* Vote Button */}
                            <form action={async () => {
                                'use server'
                                const supabase = await createClient()

                                // Fetch current votes
                                const { data: current } = await supabase
                                    .from('feature_requests')
                                    .select('votes')
                                    .eq('id', feature.id)
                                    .single()

                                // Increment
                                await supabase
                                    .from('feature_requests')
                                    .update({ votes: (current?.votes || 0) + 1 })
                                    .eq('id', feature.id)

                                revalidatePath('/features')
                            }}>
                                <button type="submit" className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 hover:bg-primary hover:text-white text-slate-400 transition-all group-hover:scale-105">
                                    <ThumbsUp className="w-5 h-5" />
                                    <span className="text-lg font-extrabold">{feature.votes || 0}</span>
                                </button>
                            </form>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {idx === 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-[10px] font-bold uppercase">Top</span>}
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{feature.title}</h3>
                                </div>
                                {feature.description && (
                                    <p className="text-slate-500 text-sm line-clamp-2">{feature.description}</p>
                                )}
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    Vorgeschlagen von {feature.profiles?.full_name || feature.profiles?.email?.split('@')[0] || 'Unbekannt'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
