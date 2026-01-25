import { createClient } from '@/lib/supabase/server'
import { Swords, Dice5, Check, X, Trophy, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createChallenge, getMyChallenges, respondToChallenge } from '@/app/(app)/challenge/actions'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function ChallengePage({ searchParams }: { searchParams: Promise<{ opponent?: string }> }) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch opponent if provided
    let opponent = null
    if (params.opponent) {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', params.opponent)
            .single()
        opponent = data
    }

    // Fetch all users for selection
    const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user?.id)
        .order('full_name')

    // Fetch user's games for suggestion
    const { data: myGames } = await supabase
        .from('inventory')
        .select('name')
        .eq('owner_id', user?.id)

    // Fetch my challenges
    const challenges = await getMyChallenges()
    const pendingChallenges = challenges.filter(c => c.status === 'pending' && c.challenged_id === user?.id)
    const myChallenges = challenges.filter(c => c.challenger_id === user?.id || c.status !== 'pending')

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <Swords className="w-8 h-8 text-primary" />
                    Herausforderungen
                </h1>
                <p className="text-slate-500 text-lg mt-1">Fordere andere Spieler zu einem Duell heraus!</p>
            </header>

            {/* New Challenge Form */}
            <section className="sky-card p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <Target className="w-6 h-6 text-red-500" />
                    Neue Herausforderung
                </h2>

                <form action={async (formData: FormData) => {
                    'use server'
                    await createChallenge(formData)
                    redirect('/challenge')
                }} className="space-y-4">
                    {/* Opponent Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Gegner auswählen</label>
                        <select
                            name="challenged_id"
                            defaultValue={opponent?.id || ''}
                            required
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white text-sm outline-none"
                        >
                            <option value="">Wähle einen Gegner...</option>
                            {allUsers?.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name || 'Anonym'}</option>
                            ))}
                        </select>
                    </div>

                    {/* Game Suggestion */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            <Dice5 className="w-4 h-4" />
                            Spielevorschlag
                        </label>
                        <div className="flex gap-2">
                            <Input
                                name="game_suggestion"
                                placeholder="z.B. Catan, Ticket to Ride..."
                                list="my-games"
                                className="flex-1 rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                            <datalist id="my-games">
                                {myGames?.map(g => (
                                    <option key={g.name} value={g.name} />
                                ))}
                            </datalist>
                        </div>
                        <p className="text-xs text-slate-400 ml-1">Optional: Schlage ein Spiel für die Herausforderung vor</p>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl h-12 font-bold shadow-lg">
                        <Swords className="w-5 h-5 mr-2" />
                        Herausforderung senden
                    </Button>
                </form>
            </section>

            {/* Pending Challenges (for me) */}
            {pendingChallenges.length > 0 && (
                <section className="sky-card p-8 space-y-4 border-2 border-yellow-200 bg-yellow-50/50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-yellow-500" />
                        Offene Herausforderungen
                    </h2>

                    {pendingChallenges.map(challenge => (
                        <div key={challenge.id} className="bg-white p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-lg font-bold text-red-600 overflow-hidden">
                                    {challenge.challenger?.avatar_url ? (
                                        <img src={challenge.challenger.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        challenge.challenger?.full_name?.[0] || '?'
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{challenge.challenger?.full_name || 'Anonym'}</p>
                                    <p className="text-sm text-slate-500">
                                        {challenge.game_suggestion ? `Spiel: ${challenge.game_suggestion}` : 'Kein Spiel vorgeschlagen'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <form action={async () => { 'use server'; await respondToChallenge(challenge.id, true); revalidatePath('/challenge') }}>
                                    <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 rounded-lg">
                                        <Check className="w-4 h-4" />
                                    </Button>
                                </form>
                                <form action={async () => { 'use server'; await respondToChallenge(challenge.id, false); revalidatePath('/challenge') }}>
                                    <Button type="submit" size="sm" variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 rounded-lg">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* My Challenges */}
            <section className="sky-card p-8 space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Meine Herausforderungen
                </h2>

                {myChallenges.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Noch keine Herausforderungen.</p>
                ) : (
                    <div className="space-y-3">
                        {myChallenges.map(challenge => {
                            const isChallenger = challenge.challenger_id === user?.id
                            const otherUser = isChallenger ? challenge.challenged : challenge.challenger
                            const statusColors: Record<string, string> = {
                                pending: 'bg-yellow-100 text-yellow-600',
                                accepted: 'bg-green-100 text-green-600',
                                declined: 'bg-red-100 text-red-600',
                                completed: 'bg-blue-100 text-blue-600'
                            }
                            const statusColor = statusColors[String(challenge.status)] || 'bg-slate-100 text-slate-600'

                            return (
                                <div key={challenge.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                                            {otherUser?.avatar_url ? (
                                                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                otherUser?.full_name?.[0] || '?'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">
                                                {isChallenger ? 'vs' : 'von'} {otherUser?.full_name || 'Anonym'}
                                            </p>
                                            {challenge.game_suggestion && (
                                                <p className="text-xs text-slate-400">{challenge.game_suggestion}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                            {challenge.status === 'pending' ? 'Ausstehend' :
                                                challenge.status === 'accepted' ? 'Angenommen' :
                                                    challenge.status === 'declined' ? 'Abgelehnt' : 'Abgeschlossen'}
                                        </span>

                                        {challenge.status === 'accepted' && (
                                            <div className="flex gap-1">
                                                <form action={async () => {
                                                    'use server'
                                                    const { completeChallenge } = await import('@/app/(app)/challenge/actions')
                                                    await completeChallenge(challenge.id, challenge.challenger_id)
                                                    revalidatePath('/challenge')
                                                }}>
                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black hover:bg-green-50 hover:text-green-600" title="Herausforderer hat gewonnen">
                                                        🏆 {challenge.challenger?.full_name?.split(' ')[0]}
                                                    </Button>
                                                </form>
                                                <form action={async () => {
                                                    'use server'
                                                    const { completeChallenge } = await import('@/app/(app)/challenge/actions')
                                                    await completeChallenge(challenge.id, challenge.challenged_id)
                                                    revalidatePath('/challenge')
                                                }}>
                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black hover:bg-blue-50 hover:text-blue-600" title="Herausgeforderter hat gewonnen">
                                                        🏆 {challenge.challenged?.full_name?.split(' ')[0]}
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                        {challenge.status === 'completed' && challenge.winner_id && (
                                            <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase">
                                                <Trophy className="w-3 h-3" />
                                                Sieger: {challenge.winner_id === challenge.challenger_id ? challenge.challenger?.full_name?.split(' ')[0] : challenge.challenged?.full_name?.split(' ')[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

