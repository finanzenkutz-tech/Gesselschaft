import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingModal } from '@/components/onboarding-modal'
import { Calendar, Users, Dice5, ArrowRight, Lightbulb, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EventCalendar } from '@/components/events/event-calendar'
import { cookies } from 'next/headers'
import { OnlineUsersWidget } from '@/components/social/online-users-widget'
import { LeaderboardCard } from '@/components/social/leaderboard-card'
import { getLeaderboard } from '@/app/(app)/events/session-actions'
import { getReviewableEvents } from '@/app/(app)/events/actions'
import { ActivityFeed, ActivityItem } from '@/components/dashboard/activity-feed'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ReviewPrompt } from '@/components/dashboard/review-prompt'

import { DigitalCheckInDialog } from '@/components/events/digital-check-in-dialog'
import { getPunctualityStats } from '@/app/(app)/events/stats-actions'
import { PunctualityLeaderboard } from '@/components/social/punctuality-leaderboard'
import { getGameOfTheMonth, getPersonalStats } from '@/app/(app)/dashboard/stats-actions'
import { GameOfTheMonthCard } from '@/components/dashboard/game-of-the-month-card'
import { PersonalSuccessPulse } from '@/components/dashboard/personal-success-pulse'
import { DrMeepleWidget } from '@/components/advisor/dr-meeple-widget'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Parallelize all data fetching
    const [
        { data: profile },
        { count: groupCount, data: myGroups },
        { count: inventoryCount },
        { data: eventsData },
        leaderboardEntries,
        { data: recentJoins },
        { data: recentGames },
        { data: recentEvents },
        { data: recentSessions },
        reviewableEvents,
        punctualityStats,
        gameOfTheMonth,
        personalStats
    ] = await Promise.all([
        supabase
            .from('profiles')
            .select('has_seen_onboarding, full_name, system_role')
            .eq('id', user.id)
            .single(),
        supabase
            .from('group_members')
            .select('*, groups(id, name)', { count: 'exact', head: false })
            .eq('user_id', user.id),
        supabase
            .from('inventory')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id),
        supabase
            .from('events')
            .select('*, groups(name), event_attendees(user_id, status, checked_in_at)')
            .order('start_time', { ascending: true }),
        getLeaderboard(),
        // Activity Feed Data
        supabase
            .from('group_members')
            .select('joined_at, profiles(full_name, avatar_url), groups(name)')
            .order('joined_at', { ascending: false })
            .limit(5),
        supabase
            .from('inventory')
            .select('created_at, name, profiles:owner_id(full_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase
            .from('events')
            .select('created_at, title, groups(name), profiles:created_by(full_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase
            .from('game_sessions')
            .select('created_at, game_name, mood, groups(name), profiles:created_by(full_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(5),
        getReviewableEvents(),
        getPunctualityStats(),
        getGameOfTheMonth(),
        getPersonalStats()
    ])

    const showOnboarding = profile ? !profile.has_seen_onboarding : false

    // Transform activities for the feed
    const activities: ActivityItem[] = [
        ...(recentJoins?.map((j: any) => ({
            id: `join-${j.joined_at}-${j.profiles?.full_name}`,
            type: 'group_joined' as const,
            title: `ist der Gruppe "${j.groups?.name}" beigetreten`,
            description: 'Willkommen in der Crew!',
            timestamp: j.joined_at,
            user: { name: j.profiles?.full_name, avatar_url: j.profiles?.avatar_url }
        })) || []),
        ...(recentGames?.map((g: any) => ({
            id: `game-${g.created_at}-${g.name}`,
            type: 'game_added' as const,
            title: `hat "${g.name}" zur Sammlung hinzugefügt`,
            description: 'Ein neues Spiel zum Ausprobieren!',
            timestamp: g.created_at,
            user: { name: g.profiles?.full_name, avatar_url: g.profiles?.avatar_url }
        })) || []),
        ...(recentEvents?.map((e: any) => ({
            id: `event-${e.created_at}-${e.title}`,
            type: 'event_created' as const,
            title: `hat ein neues Event geplant: "${e.title}"`,
            description: `In der Gruppe ${e.groups?.name}`,
            timestamp: e.created_at,
            user: { name: e.profiles?.full_name, avatar_url: e.profiles?.avatar_url }
        })) || []),
        ...(recentSessions?.map((s: any) => ({
            id: `session-${s.created_at}-${s.game_name}`,
            type: 'session_logged' as const,
            title: `hat "${s.game_name}" gespielt`,
            description: s.mood ? `Stimmung: ${s.mood} • ${s.groups?.name}` : `In der Gruppe ${s.groups?.name}`,
            timestamp: s.created_at,
            mood: s.mood,
            user: { name: s.profiles?.full_name, avatar_url: s.profiles?.avatar_url }
        })) || [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

    const cookieStore = await cookies()
    const godMode = cookieStore.get('godMode')?.value === 'true'

    // Determine Logic for Check-In Dialog
    const now = new Date()
    // Find an event that is "active" (approx start -30m to end or start+4h)
    // AND user is going, AND user is NOT checked in
    const checkInCandidate = (eventsData || []).find((e: any) => {
        const start = new Date(e.start_time)
        // If end_time is not set, assume 4h duration
        const end = e.end_time ? new Date(e.end_time) : new Date(start.getTime() + 4 * 60 * 60 * 1000)

        // Window: Starts in 30 mins or less, OR already started and not ended
        const windowStart = new Date(start.getTime() - 30 * 60 * 1000)
        // const windowEnd = end 
        // Allow check-in as long as event is running

        const isTimeWindow = now >= windowStart && now <= end

        const myAttendance = e.event_attendees?.find((a: any) => a.user_id === user.id)
        const isGoing = myAttendance?.status === 'going'
        const isNotCheckedIn = !myAttendance?.checked_in_at

        return isTimeWindow && isGoing && isNotCheckedIn
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
                <header>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full" />
                        Dashboard
                    </h1>
                    <p className="text-slate-500 text-lg mt-1 ml-5">
                        Hallo {profile?.full_name || 'Spieler'}! Hier ist deine Übersicht.
                    </p>
                </header>
                <div className="shrink-0">
                    <QuickActions groups={myGroups || []} />
                </div>
            </div>

            {/* Review Prompt for Unlogged Past Events */}
            <ReviewPrompt events={reviewableEvents as any[]} />

            {/* Digital Check-In Dialog */}
            {checkInCandidate && (
                <DigitalCheckInDialog
                    eventId={checkInCandidate.id}
                    eventTitle={checkInCandidate.title}
                    location={checkInCandidate.location}
                />
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Ideen Einreichen Card - Only for Super Admins in God Mode */}
                    {profile?.system_role === 'super_admin' && godMode && (
                        <Link href="/features" className="block">
                            <div className="rounded-3xl bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white shadow-xl shadow-orange-200 relative overflow-hidden group hover:shadow-2xl transition-all">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Lightbulb className="w-24 h-24" />
                                </div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <Lightbulb className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold">Hast du eine Idee?</h3>
                                        <p className="text-yellow-50 opacity-90">Schlage neue Funktionen vor!</p>
                                    </div>
                                    <ArrowRight className="w-6 h-6 ml-auto" />
                                </div>
                            </div>
                        </Link>
                    )}

                    {groupCount === 0 && (
                        <div className="rounded-3xl bg-[#1c7ad6] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                                <h2 className="text-2xl font-extrabold mb-4 leading-tight">
                                    Noch keiner Gruppe beigetreten?
                                </h2>
                                <p className="text-blue-50 text-base font-medium mb-6 opacity-90">
                                    Suche eine Gruppe oder gründe eine eigene, um gemeinsam Spieleabende zu planen!
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link href="/groups">
                                        <Button className="bg-white text-[#1c7ad6] hover:bg-blue-50 rounded-xl h-12 px-6 font-bold text-base shadow-lg">
                                            Gruppe suchen
                                        </Button>
                                    </Link>
                                    <Link href="/groups">
                                        <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-[#1c7ad6] border-2 border-white rounded-xl h-12 px-6 font-bold text-base transition-all">
                                            Gruppe gründen
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next Upcoming Event Card */}
                    {(() => {
                        const now = new Date()
                        const upcomingEvents = (eventsData || []).filter((e: any) => new Date(e.start_time) > now)
                        const nextEvent = upcomingEvents[0]

                        if (!nextEvent) return null

                        const eventDate = new Date(nextEvent.start_time)
                        const isToday = eventDate.toDateString() === now.toDateString()
                        const isTomorrow = eventDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()
                        const dayLabel = isToday ? 'Heute' : isTomorrow ? 'Morgen' : eventDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })
                        const timeLabel = eventDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                        const myRsvp = nextEvent.event_attendees?.find((a: any) => a.user_id === user.id)
                        const goingCount = nextEvent.event_attendees?.filter((a: any) => a.status === 'going').length || 0

                        return (
                            <Link href={`/events/${nextEvent.id}`} className="block">
                                <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all ${isToday ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200'}`}>
                                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <Calendar className="w-24 h-24" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest opacity-75 mb-1">
                                                    {isToday ? '🎲 Heute' : isTomorrow ? '📅 Morgen' : '📅 Nächstes Event'}
                                                </p>
                                                <h3 className="text-2xl font-extrabold">{nextEvent.title}</h3>
                                                <p className="opacity-90 mt-1">{nextEvent.groups?.name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-3xl font-black">{timeLabel}</p>
                                                <p className="text-sm opacity-75 font-bold">{dayLabel}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 mt-4">
                                            {nextEvent.location && (
                                                <div className="flex items-center gap-2 opacity-90">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{nextEvent.location}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 opacity-90">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm font-medium">{goingCount} dabei</span>
                                            </div>
                                            {myRsvp ? (
                                                <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${myRsvp.status === 'going' ? 'bg-white/20' : myRsvp.status === 'maybe' ? 'bg-yellow-400/30' : 'bg-red-400/30'}`}>
                                                    {myRsvp.status === 'going' ? '✓ Dabei' : myRsvp.status === 'maybe' ? '? Vielleicht' : '✗ Nicht dabei'}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-black uppercase px-2 py-1 rounded-full bg-blue-400/30 animate-pulse">
                                                    Antworten?
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })()}

                    {/* Stats Tiles & Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <Link href="/events" className="group">
                            <div className="sky-card p-5 h-full min-h-[140px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-blue-100">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Calendar className="w-20 h-20 text-blue-600" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800">Events</h3>
                                        <p className="text-slate-500 text-xs font-medium">Dein Kalender</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        Erkunden
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/groups" className="group">
                            <div className="sky-card p-5 h-full min-h-[140px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-emerald-100">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Users className="w-20 h-20 text-emerald-600" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800">Gruppen</h3>
                                        <p className="text-slate-500 text-xs font-medium">{groupCount || 0} Aktiv</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                        Deine Crew
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/inventory" className="group">
                            <div className="sky-card p-5 h-full min-h-[140px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-purple-100">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Dice5 className="w-20 h-20 text-purple-600" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <Dice5 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800">Spiele</h3>
                                        <p className="text-slate-500 text-xs font-medium">{inventoryCount || 0} Im Regal</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg group-hover:bg-purple-100 transition-colors">
                                        Sammlung
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        <div className="group h-full">
                            <PersonalSuccessPulse data={personalStats || []} />
                        </div>
                    </div>

                    <div className="lg:block">
                        <EventCalendar events={eventsData || []} userId={user.id} />
                    </div>
                </div>

                {/* Right Column (1/3) - Sidebar Widgets */}
                <div className="space-y-8">
                    <GameOfTheMonthCard game={gameOfTheMonth} />
                    <ActivityFeed activities={activities} />
                    <LeaderboardCard entries={leaderboardEntries as any[]} />
                    <OnlineUsersWidget currentUserId={user.id} />
                    <PunctualityLeaderboard stats={punctualityStats} />
                </div>
            </div>

            <OnboardingModal show={showOnboarding} />
            <DrMeepleWidget />
            <div className="pb-20" />
        </div >
    )
}
