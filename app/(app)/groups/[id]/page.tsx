import { createClient } from '@/lib/supabase/server'
import { Dice5, Calendar, Users, Settings, MapPin, History, Swords, X, Coins, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getChallengesForGroup } from '@/app/(app)/groups/challenge-actions'
import { GroupPlacesWidget } from '@/components/groups/group-places-widget'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { GroupJoinButton, GroupLeaveButton } from '@/components/groups/group-actions-buttons'
import { EditGroupDialog } from '@/components/groups/edit-group-dialog'
import { ChallengeList } from '@/components/groups/challenge-list'
import { PollWidget } from '@/components/groups/poll-widget'
import { CreatePollForm } from '@/components/groups/create-poll-form'
import { getPollsForGroup } from '@/app/(app)/groups/poll-actions'
import { GroupGamesCard } from '@/components/groups/group-games-card'
import { NextEventCountdown } from '@/components/groups/next-event-countdown'
import { RecentGamesList } from '@/components/groups/recent-games-list'
import { LogGameDialog } from '@/components/groups/log-game-dialog'
import { GroupLeaderboard } from '@/components/groups/group-leaderboard'
import { MemberComparisonDialog } from '@/components/groups/member-comparison-dialog'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { getGroupWishlist } from '@/app/(app)/groups/wishlist-actions'
import { getGroupGoals } from '@/app/(app)/groups/goal-actions'
import { GroupWishlist } from '@/components/groups/group-wishlist'
import { GroupGoals } from '@/components/groups/group-goals'
import { GroupReviewsWidget } from '@/components/groups/group-reviews-widget'
import { PreparationButton } from '@/components/groups/preparation-button'
import { GameSessionDetailDialog } from '@/components/groups/game-session-detail-dialog'
import { GroupRecommendations } from '@/components/groups/group-recommendations'
import { GroupChatWidget } from '@/components/groups/group-chat-widget'


export default async function GroupPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ log?: string }> }) {
    const { id } = await params
    const { log } = await searchParams

    try {
        console.log('[GroupPage] Starting render for ID:', id)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data: profile } = await supabase
            .from('profiles')
            .select('system_role')
            .eq('id', user?.id)
            .single()

        const isSuperAdmin = profile?.system_role === 'super_admin'

        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .single()

        if (groupError || !group) {
            return (
                <div className="sky-card p-12 text-center space-y-4">
                    <Users className="w-16 h-16 text-slate-200 mx-auto" />
                    <h1 className="text-2xl font-bold text-slate-800">Gruppe nicht gefunden</h1>
                    <p className="text-slate-500">Diese Gruppe existiert nicht oder du hast keinen Zugriff darauf.</p>
                    <Link href="/groups">
                        <Button variant="outline" className="rounded-xl">Zurück zur Übersicht</Button>
                    </Link>
                </div>
            )
        }

        const { data: members } = await supabase
            .from('group_members')
            .select('*, profiles(*)')
            .eq('group_id', id)

        const groupMembers = members || []

        const { data: places } = await supabase
            .from('group_places')
            .select('*')
            .eq('group_id', id)
            .order('created_at', { ascending: false })

        const { data: allEvents, error: eventsError } = await supabase
            .from('events')
            .select('*, event_attendees(user_id, status)')
            .eq('group_id', id)
            .order('start_time', { ascending: true })
        if (eventsError) throw new Error('Event-Fehler: ' + eventsError.message)

        const now = new Date().toISOString()
        const upcomingEvents = allEvents?.filter(e => e.start_time >= now) || []
        const pastEventsRaw = allEvents?.filter(e => e.start_time < now) || []

        const isMember = groupMembers.some((m: any) => m.user_id === user?.id)
        const isAdmin = groupMembers.some((m: any) => m.user_id === user?.id && m.role === 'admin')

        let challenges: { incoming: any[], outgoing: any[] } = { incoming: [], outgoing: [] }
        if (isMember) {
            challenges = await getChallengesForGroup(id)
        }

        const polls = await getPollsForGroup(id)

        const { getGroupGames, getGroupRecentGames, getGroupLeaderboard } = await import('@/app/(app)/groups/game-actions')
        const { getSmartRecommendations } = await import('@/app/(app)/groups/recommendation-actions')

        const groupGames = await getGroupGames(id)
        const collectionValue = groupGames.reduce((sum: number, game: any) => {
            const price = parseFloat(game.price_new) || parseFloat(game.price_used) || 0
            return sum + price
        }, 0)

        const recentGames = await getGroupRecentGames(id)
        const leaderboardData = await getGroupLeaderboard(id)
        const recommendations = await getSmartRecommendations(id) // New feature

        const wishlist = await getGroupWishlist(id)
        const goals = await getGroupGoals(id)

        const { data: reviews } = await supabase
            .from('game_reviews')
            .select('*, profiles(full_name, avatar_url), game_review_votes(user_id)')
            .eq('group_id', id)
            .order('created_at', { ascending: false })

        const { data: recentSessions } = await supabase
            .from('game_sessions')
            .select('id, game_name, played_at, winner_id')
            .eq('group_id', id)
            .order('played_at', { ascending: false })
            .limit(10)

        const combinedHistory = [
            ...pastEventsRaw.map(e => ({ ...e, type: 'event', date: e.start_time })),
            ...(recentSessions || []).map((s: any) => ({
                ...s,
                type: 'session',
                date: s.played_at,
                title: s.game_name,
                id: s.id
            }))
        ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)

        const nextEvent = upcomingEvents[0]

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Banner Section */}
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-xl bg-gradient-to-r from-primary to-blue-600">
                    <div className="h-64 relative">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:64px_64px] opacity-20" />
                        <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white w-full">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="flex items-start md:items-center gap-4 md:gap-6">
                                    <div className="text-4xl md:text-8xl drop-shadow-lg filter bg-white/10 w-20 h-20 md:w-32 md:h-32 rounded-3xl flex items-center justify-center border-2 border-white/20 backdrop-blur-sm shrink-0">
                                        {group.emoji || '🎲'}
                                    </div>
                                    <div className="space-y-1 md:space-y-2">
                                        <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight drop-shadow-md break-words">{group.name}</h1>
                                        <p className="text-blue-100 text-sm md:text-lg max-w-2xl font-medium drop-shadow-sm line-clamp-2">{group.description || 'Keine Beschreibung vorhanden.'}</p>
                                        {group.location_name && (
                                            <p className="text-white/90 flex items-center gap-1.5 font-bold bg-white/10 px-3 py-1 rounded-full w-fit backdrop-blur-md border border-white/20 text-xs md:text-base">
                                                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-blue-200" />
                                                {group.location_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {nextEvent && <NextEventCountdown nextEvent={nextEvent} />}
                </div>

                {/* Main Grid: Content & Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Actions Bar - Redesigned for better balance */}
                        {/* Actions Bar - Redesigned */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 shadow-sm sticky top-4 z-40 transition-all">
                            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                                {user && isMember && (
                                    <>
                                        <CreateEventDialog
                                            groups={[group]}
                                            defaultGroupId={id}
                                            places={places || []}
                                            trigger={
                                                <Button className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all px-8 text-base">
                                                    <Calendar className="w-6 h-6 mr-3" />
                                                    Event planen
                                                </Button>
                                            }
                                        />
                                        <LogGameDialog
                                            groupId={id}
                                            games={groupGames}
                                            members={groupMembers}
                                            places={places || []}
                                            events={combinedHistory.filter(h => h.type === 'event' && new Date(h.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) as any[]} // Last 7 days + future
                                            currentUserId={user?.id}
                                            defaultOpen={log === 'true'}
                                            trigger={
                                                <Button variant="outline" className="h-14 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:border-primary/50 hover:text-primary hover:bg-white shadow-sm transition-all px-6 text-base">
                                                    <Dice5 className="w-6 h-6 mr-2" />
                                                    Spiel nachtragen
                                                </Button>
                                            }
                                        />
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                {user && (
                                    <>
                                        {(isSuperAdmin || group.created_by === user.id) && (
                                            <EditGroupDialog group={group}
                                                trigger={
                                                    <Button variant="ghost" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                                        <Settings className="w-5 h-5" />
                                                    </Button>
                                                }
                                            />
                                        )}
                                        {isMember ? (
                                            (isSuperAdmin || group.created_by !== user.id) && <GroupLeaveButton groupId={id} />
                                        ) : (
                                            <GroupJoinButton groupId={id} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Summary / Recent Games */}
                        {isMember && recentGames && recentGames.length > 0 && (
                            <div className="animate-in slide-in-from-bottom-2 duration-700">
                                <RecentGamesList games={recentGames} groupId={id} members={groupMembers} places={places || []} allGames={groupGames} />
                            </div>
                        )}

                        {/* Recommendations / Pile of Shame - New Feature */}
                        {isMember && (
                            <div className="animate-in slide-in-from-bottom-2 duration-700 delay-200">
                                <GroupRecommendations recommendations={recommendations} />
                            </div>
                        )}

                        {/* Events Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-primary" />
                                    Anstehende Events
                                </h2>

                                {isMember && <CreateEventDialog groups={[group]} defaultGroupId={id} places={places || []}
                                    trigger={
                                        <Link href="/calendar">
                                            <Button variant="link" className="text-primary font-bold">Zum Kalender</Button>
                                        </Link>
                                    }
                                />}
                            </div>
                            {upcomingEvents.length === 0 ? (
                                <div className="sky-card p-12 text-center text-slate-400 border-dashed border-2 bg-slate-50/50">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-bold">Keine anstehenden Abenteuer geplant.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {upcomingEvents.map(event => (
                                        <Link key={event.id} href={`/events/${event.id}`}>
                                            <div className="sky-card p-6 h-full hover:shadow-2xl hover:-translate-y-1 transition-all border-l-4 border-l-primary group bg-white/50 backdrop-blur-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-black text-slate-800 truncate group-hover:text-primary transition-colors text-lg tracking-tight">{event.title}</h3>
                                                    {event.start_time.startsWith(now.split('T')[0]) && (
                                                        <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-green-200">Heute</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Calendar className="w-3 h-3 text-primary" />
                                                    {new Date(event.start_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                                                    <div className="flex -space-x-2">
                                                        {event.event_attendees?.filter((a: any) => a.status === 'going').slice(0, 4).map((a: any, i: number) => (
                                                            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white text-[10px] flex items-center justify-center font-black text-slate-500 shadow-sm">
                                                                {a.profiles?.full_name?.[0] || '?'}
                                                            </div>
                                                        ))}
                                                        {(event.event_attendees?.filter((a: any) => a.status === 'going').length || 0) > 4 && (
                                                            <div className="w-8 h-8 rounded-full bg-primary text-white border-2 border-white text-[8px] flex items-center justify-center font-black shadow-sm">
                                                                +{(event.event_attendees?.filter((a: any) => a.status === 'going').length || 0) - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">
                                                        Dabei
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Challenges & Gamification */}
                        {isMember && (challenges.incoming.length > 0 || challenges.outgoing.length > 0) && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <Swords className="w-6 h-6 text-orange-500" /> Herausforderungen
                                </h2>
                                <div className="sky-card p-6 bg-gradient-to-br from-orange-50/50 to-white">
                                    <ChallengeList incoming={challenges.incoming} outgoing={challenges.outgoing} isAdmin={isAdmin} groupName={group.name} />
                                </div>
                            </div>
                        )}

                        {/* Leaderboard */}
                        {leaderboardData && leaderboardData.length > 0 && (
                            <div className="animate-in slide-in-from-bottom-2 duration-700">
                                <GroupLeaderboard data={leaderboardData} />
                            </div>
                        )}

                        {/* Goals & Wishlist */}
                        {isMember && (
                            <>
                                <div className="animate-in slide-in-from-bottom-2 fade-in duration-700 delay-300">
                                    <GroupGoals groupId={id} goals={goals} isAdmin={isAdmin} />
                                </div>
                                <div className="animate-in slide-in-from-bottom-2 fade-in duration-700 delay-400">
                                    <GroupWishlist groupId={id} wishlist={wishlist} userId={user?.id} isAdmin={isAdmin} />
                                </div>
                            </>
                        )}

                        {/* Places Widget */}
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-700 delay-300">
                            <GroupPlacesWidget groupId={id} places={places || []} isMember={isMember} isAdmin={isAdmin} currentUserId={user?.id} />
                        </div>

                        {/* Activity History */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <History className="w-6 h-6 text-slate-400" /> Chronik
                            </h2>
                            {combinedHistory.length === 0 ? (
                                <p className="text-slate-400 text-sm italic py-8 text-center sky-card border-dashed">Noch keine vergangenen Aktivitäten.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {combinedHistory.map((item: any, idx: number) => (
                                        <div key={`${item.type}-${item.id}-${idx}`}>
                                            {item.type === 'event' ? (
                                                <Link href={`/events/${item.id}`}>
                                                    <div className="sky-card p-5 flex items-center justify-between hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all opacity-80 hover:opacity-100 group border-l-4 border-l-blue-400 bg-blue-50/30 h-full">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                                                <Calendar className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-slate-700 group-hover:text-primary transition-colors text-sm tracking-tight line-clamp-1">{item.title}</h3>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                                    Event • {item.date ? new Date(item.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : 'Datum unbekannt'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <GameSessionDetailDialog
                                                    sessionId={item.id}
                                                    trigger={
                                                        <div className="sky-card p-5 flex items-center justify-between hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all group border-l-4 border-l-amber-400 bg-amber-50/30 cursor-pointer h-full">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                                                                    <Dice5 className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-slate-700 text-sm tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                                        Spielrunde • {item.date ? new Date(item.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : 'Datum unbekannt'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {item.winner_id && (
                                                                <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full shadow-lg shadow-amber-200 border border-amber-400 scale-90">
                                                                    <Trophy className="w-3 h-3 fill-white" />
                                                                    <span className="text-[8px] font-black uppercase tracking-widest">Sieg</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    }
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column (1/3) */}
                    <div className="space-y-8">
                        {/* Preparation Button ("Pausenbutton") */}
                        <PreparationButton
                            groupId={id}
                            nextEvent={nextEvent}
                            isMember={!!isMember}
                        />

                        {/* Polls Widget */}
                        {isMember && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-slate-800">Umfragen</h3>
                                    <CreatePollForm groupId={id} />
                                </div>
                                {polls.length > 0 ? (
                                    <PollWidget polls={polls} groupId={id} userId={user?.id} />
                                ) : (
                                    <div className="sky-card p-8 text-center text-slate-400 text-sm font-bold border-dashed border-2 bg-slate-50/30">
                                        Aktuell laufen keine Termin-Umfragen.
                                    </div>
                                )}
                            </div>
                        )}

                        {isMember && (
                            <div className="animate-in slide-in-from-right-2 fade-in duration-700 delay-100">
                                <GroupChatWidget groupId={id} user={user} />
                            </div>
                        )}

                        <GroupReviewsWidget reviews={reviews || []} currentUserId={user?.id} />


                        {/* Stats Card */}
                        <div className="sky-card p-6 bg-slate-900 text-white border-0 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Gruppen-Pulse</h3>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-3xl font-black">{collectionValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sammlungswert</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-xl font-black text-blue-400">{groupGames.length}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">Spiele</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-emerald-400">{groupMembers.length}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">Gefährten</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collection Shortcut */}
                        <div className="animate-in slide-in-from-right-2 fade-in duration-700">
                            <GroupGamesCard games={groupGames} />
                        </div>

                        {/* Members Card */}
                        <div className="sky-card p-6 bg-white shadow-sm border-slate-100">
                            <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-secondary" /> Gefährten
                            </h3>
                            <div className="space-y-4">
                                {groupMembers
                                    .sort((a: any, b: any) => {
                                        if (a.role === 'admin' && b.role !== 'admin') return -1
                                        if (a.role !== 'admin' && b.role === 'admin') return 1
                                        return 0
                                    })
                                    .map((member: any) => {
                                        const isFounder = member.user_id === group.created_by
                                        const isSelf = member.user_id === user?.id
                                        const stats = leaderboardData.find((l: any) => l.id === member.user_id)

                                        const memberElement = (
                                            <div key={member.user_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group/member">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-200 overflow-hidden shrink-0 shadow-sm transition-transform group-hover/member:rotate-3",
                                                    isFounder ? 'bg-amber-100 text-amber-600 border-amber-300' :
                                                        member.role === 'admin' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                                                            'bg-blue-100 text-blue-600 border-blue-200'
                                                )}>
                                                    {member.profiles?.avatar_url ? (
                                                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : member.profiles?.full_name?.[0] || '?'}
                                                </div>
                                                <div className="overflow-hidden flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-black text-slate-700 truncate">{member.profiles?.full_name}</p>
                                                        {stats && stats.gamesPlayed >= 10 && (stats.wins / stats.gamesPlayed) > 0.5 && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" title="Dominator" />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isFounder ? 'Gründer' : member.role}</p>
                                                </div>
                                                {!isSelf && (
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-all text-primary hover:bg-primary hover:text-white border border-slate-100">
                                                        <Swords className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        )

                                        if (isSelf) return memberElement
                                        return <MemberComparisonDialog key={member.user_id} groupId={id} member={member} trigger={memberElement} />
                                    })}
                            </div>
                        </div>

                        <Link href="/groups" className="block mt-4">
                            <Button variant="outline" className="w-full rounded-2xl py-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary">
                                Zurück zur Übersicht
                            </Button>
                        </Link>
                    </div>
                </div>
            </div >
        )
    } catch (error: any) {
        console.error('[GroupPage] Error:', error)
        return (
            <div className="sky-card p-12 text-center space-y-4">
                <X className="text-red-500 w-12 h-12 mx-auto" />
                <h1 className="text-2xl font-bold">Fehler beim Laden der Gruppe</h1>
                <p className="text-slate-500">{error?.message || 'Unbekannter Fehler'}</p>
                <Link href="/groups">
                    <Button variant="outline">Zurück zur Übersicht</Button>
                </Link>
            </div>
        )
    }
}
