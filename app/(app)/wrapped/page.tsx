import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Calendar, Users, Dice5, Car, Pizza, Clock, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function WrappedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1).toISOString()

    // Fetch user's yearly stats
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, points, badges')
        .eq('id', user.id)
        .single()

    // Events attended this year
    const { count: eventsAttended } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'going')
        .gte('created_at', startOfYear)

    // Games played
    const { count: gamesPlayed } = await supabase
        .from('game_session_players')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfYear)

    // Wins
    const { count: wins } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', user.id)
        .gte('played_at', startOfYear)

    // Contributions made
    const { count: contributions } = await supabase
        .from('event_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfYear)

    // Carpools offered
    const { count: carpoolsOffered } = await supabase
        .from('carpooling')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .gte('created_at', startOfYear)

    // Games added to inventory
    const { count: gamesAdded } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .gte('created_at', startOfYear)

    // Most played game (simplified)
    const { data: mostPlayedData } = await supabase
        .from('game_sessions')
        .select('game_name')
        .gte('played_at', startOfYear)
        .limit(100)

    const gameCounts: Record<string, number> = {}
    mostPlayedData?.forEach(session => {
        gameCounts[session.game_name] = (gameCounts[session.game_name] || 0) + 1
    })
    const mostPlayedGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]

    const stats = [
        { label: 'Events besucht', value: eventsAttended || 0, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Spiele gespielt', value: gamesPlayed || 0, icon: Dice5, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Siege', value: wins || 0, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { label: 'Snacks mitgebracht', value: contributions || 0, icon: Pizza, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Fahrten angeboten', value: carpoolsOffered || 0, icon: Car, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Spiele hinzugefügt', value: gamesAdded || 0, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-blue-600 to-purple-600 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-1000">
                {/* Header */}
                <div className="text-center text-white pt-8">
                    <p className="text-blue-100 font-bold uppercase tracking-widest text-sm mb-2">Board Game Hub</p>
                    <h1 className="text-5xl md:text-7xl font-black mb-4">#{currentYear}</h1>
                    <p className="text-xl text-blue-100">
                        Dein Spielejahr, <span className="font-bold text-white">{profile?.full_name || 'Spieler'}</span>!
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center border border-white/20 animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-white mb-1">{stat.value}</p>
                            <p className="text-blue-100 text-sm font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Highlights */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-400" />
                        Highlights
                    </h2>

                    <div className="space-y-4">
                        {mostPlayedGame && (
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Dice5 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">Meistgespieltes Spiel</p>
                                    <p className="text-blue-100">{mostPlayedGame[0]} ({mostPlayedGame[1]}x)</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white font-bold">Gesamtpunkte</p>
                                <p className="text-blue-100">{profile?.points || 0} Punkte gesammelt</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center pb-8">
                    <Link href="/">
                        <Button className="bg-white text-primary hover:bg-blue-50 rounded-2xl h-14 px-8 font-bold text-lg shadow-xl">
                            Zurück zum Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
