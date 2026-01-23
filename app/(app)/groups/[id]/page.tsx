import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Dice5, Calendar, Users, Settings, UserPlus, LogOut, Plus, MapPin, History, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinGroup, leaveGroup } from '@/app/groups/member-actions'
import { getChallengesForGroup } from '@/app/groups/challenge-actions'
import { revalidatePath } from 'next/cache'
import { GroupPlacesWidget } from '@/components/groups/group-places-widget'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { GroupJoinButton, GroupLeaveButton } from '@/components/groups/group-actions-buttons'
import { AddPlaceDialog } from '@/components/groups/add-place-dialog'
import { EditGroupDialog } from '@/components/groups/edit-group-dialog'
import { ChallengeList } from '@/components/groups/challenge-list'
import { LocationPicker } from '@/components/groups/location-picker'
import { PollWidget } from '@/components/groups/poll-widget'
import { CreatePollForm } from '@/components/groups/create-poll-form'
import { getPollsForGroup } from '@/app/groups/poll-actions'
import { GroupGamesCard } from '@/components/groups/group-games-card'
import { NextEventCountdown } from '@/components/groups/next-event-countdown'
import { ViewPlaceMapDialog } from '@/components/groups/view-place-map-dialog'
import Link from 'next/link'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
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
        console.error('Group fetch error:', groupError)
        return (
            <div className="sky-card p-12 text-center space-y-4">
                <Users className="w-16 h-16 text-slate-200 mx-auto" />
                <h1 className="text-2xl font-bold text-slate-800">Gruppe nicht gefunden</h1>
                <p className="text-slate-500">Diese Gruppe existiert nicht oder du hast keinen Zugriff darauf.</p>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-400 font-mono text-left max-w-sm mx-auto overflow-auto">
                    ID: {id}<br />
                    Error: {groupError?.message || 'Unknown'}
                </div>
                <Link href="/groups">
                    <Button variant="outline" className="rounded-xl">Zurück zur Übersicht</Button>
                </Link>
            </div>
        )
    }

    // Fetch members separately for better RLS isolation
    const { data: members } = await supabase
        .from('group_members')
        .select('*, profiles(*)')
        .eq('group_id', id)

    const groupMembers = members || []

    // Fetch Places
    const { data: places } = await supabase
        .from('group_places')
        .select('*')
        .eq('group_id', id)
        .order('created_at', { ascending: false })

    // Fetch All Group Events
    const { data: allEvents } = await supabase
        .from('events')
        .select('*, event_attendees(user_id, status)')
        .eq('group_id', id)
        .order('start_time', { ascending: true })

    const now = new Date().toISOString()
    const upcomingEvents = allEvents?.filter(e => e.start_time >= now) || []
    const pastEvents = allEvents?.filter(e => e.start_time < now).reverse().slice(0, 5) || []

    const isMember = groupMembers.some((m: any) => m.user_id === user?.id)
    const isAdmin = groupMembers.some((m: any) => m.user_id === user?.id && m.role === 'admin')

    // Fetch Challenges if member
    let challenges: { incoming: any[], outgoing: any[] } = { incoming: [], outgoing: [] }
    if (isMember) {
        challenges = await getChallengesForGroup(id)
    }

    // Fetch Polls
    const polls = await getPollsForGroup(id)

    // Fetch Group Games
    const { getGroupGames } = await import('@/app/groups/game-actions')
    const groupGames = await getGroupGames(id)

    // Calculate next event
    const nextEvent = upcomingEvents[0]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Banner */}
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

                {/* Next Event Countdown Banner */}
                {nextEvent && <NextEventCountdown nextEvent={nextEvent} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Actions Bar */}
                    <div className="sky-card p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x">
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-primary hover:bg-blue-50 text-xs md:text-sm whitespace-nowrap">
                                <Calendar className="w-4 h-4" /> Events
                            </Button>
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-primary hover:bg-blue-50 text-xs md:text-sm whitespace-nowrap">
                                <Users className="w-4 h-4" /> Mitglieder
                            </Button>
                            <Link href="/groups/map">
                                <Button variant="ghost" className="gap-2 text-slate-600 hover:text-primary hover:bg-blue-50 text-xs md:text-sm whitespace-nowrap">
                                    <MapPin className="w-4 h-4" /> Karte
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                            {user && (
                                <>
                                    <AddPlaceDialog
                                        groupId={id}
                                        trigger={
                                            <Button variant="outline" size="sm" className="flex-1 sm:flex-initial rounded-xl border-dashed border-2 border-slate-300 text-slate-500 hover:text-primary hover:border-primary text-xs md:text-sm">
                                                <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                                Ort <span className="hidden xs:inline ml-1">hinzufügen</span>
                                            </Button>
                                        }
                                    />
                                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
                                </>
                            )}

                            {isMember && (
                                <CreateEventDialog
                                    groups={[group]}
                                    defaultGroupId={id}
                                    places={places || []}
                                />
                            )}

                            {/* Edit Group Button - ONLY Founder or SuperAdmin */}
                            {(isSuperAdmin || (user && group.created_by === user.id)) ? (
                                <div className="flex gap-2 flex-1 sm:flex-initial justify-end">
                                    <EditGroupDialog group={group} />
                                    {isMember && (user && group.created_by !== user.id) && (
                                        <GroupLeaveButton groupId={id} />
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 sm:flex-initial flex justify-end">
                                    {isMember ? (
                                        <GroupLeaveButton groupId={id} />
                                    ) : (
                                        <GroupJoinButton groupId={id} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Group Games Collection */}
                    <div className="animate-in slide-in-from-bottom-2 fade-in duration-700">
                        <GroupGamesCard games={groupGames} />
                    </div>

                    {/* Events Preview */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Kommende Events
                        </h2>
                        {upcomingEvents.length === 0 ? (
                            <div className="sky-card p-12 text-center text-slate-400 border-dashed border-2">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Noch keine Events geplant.</p>
                                {isMember && (
                                    <div className="mt-4">
                                        <CreateEventDialog groups={[group]} defaultGroupId={id} places={places || []} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingEvents.map(event => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="sky-card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{event.title}</h3>
                                                {event.start_time.startsWith(now.split('T')[0]) && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Heute</span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Calendar className="w-3 h-3 text-primary" />
                                                    {new Date(event.start_time).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                                                <div className="flex -space-x-1.5">
                                                    {event.event_attendees?.filter((a: any) => a.status === 'going').slice(0, 3).map((a: any, idx: number) => (
                                                        <div key={idx} className="w-6 h-6 rounded-full bg-green-100 border-2 border-white text-[8px] flex items-center justify-center font-bold text-green-600">
                                                            P{idx + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                                {event.event_attendees?.filter((a: any) => a.status === 'going').length > 0 ? (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {event.event_attendees.filter((a: any) => a.status === 'going').length} dabei
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 italic">Noch keine Zusagen</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Challenges Section */}
                    {isMember && (challenges.incoming.length > 0 || challenges.outgoing.length > 0) && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Swords className="w-6 h-6 text-orange-500" />
                                Herausforderungen
                            </h2>
                            <div className="sky-card p-4 md:p-6">
                                <ChallengeList
                                    incoming={challenges.incoming}
                                    outgoing={challenges.outgoing}
                                    isAdmin={isAdmin}
                                    groupName={group.name}
                                />
                            </div>
                        </div>
                    )}

                    {/* Polls Section */}
                    {isMember && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-primary" />
                                    Termin-Findung
                                </h2>
                                <CreatePollForm groupId={id} />
                            </div>

                            {polls.length > 0 ? (
                                <PollWidget polls={polls} groupId={id} userId={user?.id} />
                            ) : (
                                <div className="sky-card p-6 text-center text-slate-500 text-sm">
                                    Aktuell laufen keine Termin-Umfragen.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Places Widget */}
                    <GroupPlacesWidget
                        groupId={id}
                        places={places || []}
                        isMember={isMember}
                        isAdmin={isAdmin}
                        currentUserId={user?.id}
                    />

                    {/* History */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <History className="w-6 h-6 text-slate-400" />
                            Historie
                        </h2>
                        {pastEvents.length === 0 ? (
                            <p className="text-slate-400 text-sm italic py-4">Noch keine vergangenen Events.</p>
                        ) : (
                            <div className="space-y-3">
                                {pastEvents.map(event => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="sky-card p-4 flex items-center justify-between hover:bg-slate-50 transition-colors opacity-70 hover:opacity-100">
                                            <div>
                                                <h3 className="font-bold text-sm text-slate-700">{event.title}</h3>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(event.start_time).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="flex -space-x-2">
                                                {event.event_attendees?.filter((a: any) => a.status === 'going').slice(0, 3).map((a: any, idx: number) => (
                                                    <div key={idx} className="w-6 h-6 rounded-full bg-slate-100 border border-white text-[8px] flex items-center justify-center font-bold text-slate-400" />
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar info */}
                <div className="space-y-8">
                    {/* Active Group Location Map (Visible to Everyone) */}
                    <div className="sky-card p-0 overflow-hidden group">
                        <div className="px-4 md:px-6 py-4 border-b border-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" />
                                Standort
                            </h3>
                            {group.location_name ? (
                                <p className="text-sm text-slate-500 truncate">{group.location_name}</p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Kein Standort festgelegt</p>
                            )}
                        </div>
                        {group.location_name && group.latitude && group.longitude ? (
                            <div className="h-48 relative bg-slate-100 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/leaflet-extras/leaflet-providers/master/preview/OpenStreetMap.Mapnik.png')] bg-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ViewPlaceMapDialog
                                        latitude={group.latitude}
                                        longitude={group.longitude}
                                        name={group.location_name}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                                <MapPin className="w-8 h-8 opacity-20" />
                            </div>
                        )}
                    </div>

                    {/* Admin Location Settings */}
                    {isAdmin && (
                        <div className="sky-card p-0 overflow-hidden">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="location" className="border-0">
                                    <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline hover:bg-slate-50">
                                        <div className="flex items-center gap-2 font-bold text-slate-800">
                                            <Settings className="w-5 h-5 text-slate-400" />
                                            Standort bearbeiten
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 md:px-6 pb-6 pt-0">
                                        <LocationPicker
                                            groupId={id}
                                            initialLat={group.latitude}
                                            initialLng={group.longitude}
                                            initialName={group.location_name}
                                            initialPublic={group.is_location_public}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    )}

                    <div className="sky-card p-4 md:p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-secondary" />
                            Mitglieder ({groupMembers.length})
                        </h3>
                        <div className="space-y-3">
                            {groupMembers
                                .sort((a: any, b: any) => {
                                    // Admins zuerst
                                    if (a.role === 'admin' && b.role !== 'admin') return -1
                                    if (a.role !== 'admin' && b.role === 'admin') return 1
                                    return 0
                                })
                                .map((member: any) => {
                                    const isFounder = member.role === 'admin' && member.user_id === group.created_by
                                    return (
                                        <div key={member.user_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                            <div className="relative">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 overflow-hidden ${isFounder
                                                    ? 'bg-amber-100 text-amber-600 border-amber-300'
                                                    : member.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-600 border-purple-200'
                                                        : 'bg-blue-100 text-blue-600 border-blue-200'
                                                    }`}>
                                                    {member.profiles?.avatar_url ? (
                                                        <img src={member.profiles.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        member.profiles?.full_name?.[0] || '?'
                                                    )}
                                                </div>
                                                {isFounder && <div className="absolute -top-1 -right-1 text-[10px]">👑</div>}
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <p className="text-sm font-bold text-slate-700 truncate">
                                                    {member.profiles?.full_name || 'User'}
                                                </p>
                                                <p className={`text-xs font-bold truncate ${isFounder
                                                    ? 'text-amber-500'
                                                    : member.role === 'admin'
                                                        ? 'text-purple-500'
                                                        : 'text-slate-400'
                                                    }`}>
                                                    {isFounder ? 'Gründer' : member.role === 'admin' ? 'Admin' : 'Mitglied'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>

                    <Link href="/groups">
                        <Button variant="ghost" className="w-full text-slate-400 hover:text-primary rounded-xl text-sm font-bold py-6">
                            Zurück zur Übersicht
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
