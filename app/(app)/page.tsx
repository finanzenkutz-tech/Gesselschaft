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

            {/* Dashboard Stats - Premium Light Design */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Nächste Events Widget */}
                <Link href="/events" className="group">
                    <div className="sky-card p-6 h-full min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-blue-100">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Calendar className="w-24 h-24 text-blue-600" />
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-800">Events</h3>
                                <p className="text-slate-500 text-sm font-medium">Dein Kalender</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                                Zum Kalender
                            </span>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Meine Gruppen Widget */}
                <Link href="/groups" className="group">
                    <div className="sky-card p-6 h-full min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-emerald-100">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24 text-emerald-600" />
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-800">Gruppen</h3>
                                <p className="text-slate-500 text-sm font-medium">Deine Crew</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-emerald-600">{groupCount || 0}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Aktiv</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Meine Sammlung Widget */}
                <Link href="/inventory" className="group">
                    <div className="sky-card p-6 h-full min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-purple-100">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Dice5 className="w-24 h-24 text-purple-600" />
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Dice5 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-800">Sammlung</h3>
                                <p className="text-slate-500 text-sm font-medium">Deine Spiele</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-purple-600">{inventoryCount || 0}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Spiele</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
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
