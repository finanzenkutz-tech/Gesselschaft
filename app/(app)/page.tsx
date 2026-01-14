import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingModal } from '@/components/onboarding-modal'
import { Calendar, Users, Dice5, ArrowRight, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventCalendar } from '@/components/events/event-calendar'
import { OnlineUsersWidget } from '@/components/social/online-users-widget'
import { LeaderboardCard } from '@/components/social/leaderboard-card'
import { getLeaderboard } from '@/app/events/session-actions'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('has_seen_onboarding')
        .eq('id', user.id)
        .single()

    const { count: groupCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const showOnboarding = profile ? !profile.has_seen_onboarding : false

    const { count: inventoryCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

    // Fetch events for calendar
    const { data: events } = await supabase
        .from('events')
        .select('*, groups(name), event_attendees(user_id, status)')
        .order('start_time', { ascending: true })

    const leaderboardEntries = await getLeaderboard()

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Ideen Einreichen Card */}
            <Link href="/features" className="block">
                <div className="rounded-[2rem] bg-gradient-to-r from-yellow-400 to-orange-500 p-6 md:p-8 text-white shadow-xl shadow-orange-200 relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Lightbulb className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Lightbulb className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-extrabold">Hast du eine Idee?</h3>
                            <p className="text-yellow-50 opacity-90">Schlage neue Funktionen für Game Hub vor!</p>
                        </div>
                        <ArrowRight className="w-6 h-6 ml-auto" />
                    </div>
                </div>
            </Link>

            {groupCount === 0 && (
                <div className="rounded-[2rem] bg-[#1c7ad6] p-8 md:p-12 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Users className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                            Und du bist doch keiner Gruppe beigetreten?
                        </h2>
                        <p className="text-blue-50 text-xl font-medium mb-8 opacity-90">
                            Suche eine Gruppe oder gründe eine eigene, um gemeinsam Spieleabende zu planen!
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/groups">
                                <Button className="bg-white text-[#1c7ad6] hover:bg-blue-50 rounded-2xl h-14 px-8 font-bold text-lg shadow-lg">
                                    Gruppe suchen
                                </Button>
                            </Link>
                            <Link href="/groups">
                                <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-[#1c7ad6] border-2 border-white rounded-2xl h-14 px-8 font-bold text-lg transition-all">
                                    Gruppe gründen
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <header className="pt-8 pb-4">
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    Dashboard
                </h1>
                <p className="text-slate-500 text-lg mt-2 ml-5">
                    Willkommen zurück! Hier ist deine Übersicht.
                </p>
            </header>

            {/* Dashboard Stats - New Premium Design */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Nächste Events Widget */}
                <Link href="/events" className="group">
                    <div className="relative h-52 rounded-[2rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />

                        {/* Icon */}
                        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/30 group-hover:rotate-6 transition-transform">
                            <Calendar className="w-7 h-7" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h3 className="font-black text-2xl tracking-tight">Nächste Events</h3>
                            <p className="text-blue-100/80 text-sm mt-1">Plane deinen nächsten Spieleabend</p>
                        </div>

                        {/* Action */}
                        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold text-sm px-4 py-2 rounded-xl border border-white/30 group-hover:bg-white group-hover:text-blue-600 transition-all">
                            Planen <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>

                {/* Meine Gruppen Widget */}
                <Link href="/groups" className="group">
                    <div className="relative h-52 rounded-[2rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-6 text-white shadow-xl shadow-teal-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />

                        {/* Big Number */}
                        <div className="absolute top-4 right-6 text-7xl font-black text-white/20 group-hover:text-white/30 transition-colors">
                            {groupCount || 0}
                        </div>

                        {/* Icon */}
                        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/30 group-hover:rotate-6 transition-transform">
                            <Users className="w-7 h-7" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h3 className="font-black text-2xl tracking-tight">Meine Gruppen</h3>
                            <p className="text-emerald-100/80 text-sm mt-1">
                                {groupCount === 0 ? 'Tritt einer Gruppe bei!' : `${groupCount} aktive Gruppen`}
                            </p>
                        </div>

                        {/* Action */}
                        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold text-sm px-4 py-2 rounded-xl border border-white/30 group-hover:bg-white group-hover:text-teal-600 transition-all">
                            Ansehen <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>

                {/* Meine Sammlung Widget */}
                <Link href="/inventory" className="group">
                    <div className="relative h-52 rounded-[2rem] bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-700 p-6 text-white shadow-xl shadow-purple-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />

                        {/* Big Number */}
                        <div className="absolute top-4 right-6 text-7xl font-black text-white/20 group-hover:text-white/30 transition-colors">
                            {inventoryCount || 0}
                        </div>

                        {/* Icon */}
                        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/30 group-hover:rotate-6 transition-transform">
                            <Dice5 className="w-7 h-7" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h3 className="font-black text-2xl tracking-tight">Meine Sammlung</h3>
                            <p className="text-purple-100/80 text-sm mt-1">
                                {inventoryCount === 0 ? 'Füge dein erstes Spiel hinzu!' : `${inventoryCount} Spiele eingetragen`}
                            </p>
                        </div>

                        {/* Action */}
                        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold text-sm px-4 py-2 rounded-xl border border-white/30 group-hover:bg-white group-hover:text-purple-600 transition-all">
                            Verwalten <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>
            </section>

            {/* Calendar View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <EventCalendar events={events || []} userId={user.id} />
                </div>
                <div className="space-y-8">
                    <OnlineUsersWidget currentUserId={user.id} />
                    <LeaderboardCard entries={leaderboardEntries as any[]} />
                </div>
            </div>

            <OnboardingModal show={showOnboarding} />
            <div className="pb-20" />
        </div>
    )
}
