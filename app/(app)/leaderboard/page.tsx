import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Medal, Award, Crown, Dice5, Calendar, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function LeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch leaderboard data
    const { data: leaderboard } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, points, badges, last_seen')
        .order('points', { ascending: false })
        .limit(50)

    // Fetch win counts per user
    const { data: winCounts } = await supabase
        .from('game_sessions')
        .select('winner_id')
        .not('winner_id', 'is', null)

    const winsPerUser: Record<string, number> = {}
    winCounts?.forEach(session => {
        if (session.winner_id) {
            winsPerUser[session.winner_id] = (winsPerUser[session.winner_id] || 0) + 1
        }
    })

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />
        if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />
        if (index === 2) return <Award className="w-6 h-6 text-amber-600" />
        return <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{index + 1}</span>
    }

    const getRankBg = (index: number) => {
        if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
        if (index === 1) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
        if (index === 2) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        return 'bg-white border-slate-100'
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Ewige Bestenliste
                    </h1>
                    <p className="text-slate-500 text-lg mt-1">Die Top-Spieler aller Zeiten</p>
                </div>
                <Link
                    href="/wrapped"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                    <Star className="w-5 h-5" />
                    Dein Jahresrückblick
                </Link>
            </header>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                {leaderboard?.slice(0, 3).map((entry, index) => {
                    const podiumOrder = [1, 0, 2] // 2nd, 1st, 3rd
                    const actualIndex = podiumOrder[index]
                    const podiumEntry = leaderboard[actualIndex]
                    const heights = ['h-32', 'h-40', 'h-24']
                    const colors = ['bg-slate-100', 'bg-yellow-100', 'bg-amber-100']

                    return (
                        <div key={podiumEntry.id} className="flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 border-4",
                                actualIndex === 0 ? "bg-yellow-100 border-yellow-300 text-yellow-700" :
                                    actualIndex === 1 ? "bg-slate-100 border-slate-300 text-slate-600" :
                                        "bg-amber-100 border-amber-300 text-amber-700"
                            )}>
                                {podiumEntry.full_name?.[0] || podiumEntry.email?.[0] || '?'}
                            </div>
                            <p className="font-bold text-sm text-slate-800 text-center truncate w-full">
                                {podiumEntry.full_name || podiumEntry.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-500">{podiumEntry.points || 0} Punkte</p>
                            <div className={cn(
                                "w-full rounded-t-xl mt-2 flex items-end justify-center",
                                heights[index],
                                colors[actualIndex]
                            )}>
                                {getRankIcon(actualIndex)}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Full Leaderboard */}
            <div className="sky-card overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {leaderboard?.map((entry, index) => {
                        const isCurrentUser = entry.id === user.id
                        const wins = winsPerUser[entry.id] || 0

                        return (
                            <div
                                key={entry.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 transition-colors",
                                    getRankBg(index),
                                    isCurrentUser && "ring-2 ring-primary ring-inset"
                                )}
                            >
                                <div className="w-10 flex justify-center">
                                    {getRankIcon(index)}
                                </div>

                                <div className="w-12 h-12 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                                    {entry.full_name?.[0] || entry.email?.[0] || '?'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">
                                        {entry.full_name || entry.email?.split('@')[0]}
                                        {isCurrentUser && <span className="text-primary ml-2">(Du)</span>}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-yellow-500" />
                                            {wins} Siege
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-800">{entry.points || 0}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Punkte</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
