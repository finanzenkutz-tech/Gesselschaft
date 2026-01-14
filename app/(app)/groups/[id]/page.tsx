import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Dice5, Calendar, Users, Settings, UserPlus, LogOut, Plus, MapPin, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinGroup, leaveGroup } from '@/app/groups/member-actions'
import { revalidatePath } from 'next/cache'
import { GroupPlacesWidget } from '@/components/groups/group-places-widget'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { GroupJoinButton, GroupLeaveButton } from '@/components/groups/group-actions-buttons'
import { AddPlaceDialog } from '@/components/groups/add-place-dialog'
import Link from 'next/link'

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Banner */}
            <div className="relative h-64 rounded-[2.5rem] bg-gradient-to-r from-primary to-blue-600 overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:64px_64px] opacity-20" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{group.name}</h1>
                            <p className="text-blue-100 text-lg max-w-2xl">{group.description || 'Keine Beschreibung vorhanden.'}</p>
                        </div>
                        {isMember && (
                            <div className="flex gap-3">
                                <AddPlaceDialog
                                    groupId={id}
                                    trigger={
                                        <Button variant="secondary" className="rounded-xl shadow-lg bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 border-2">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <span>Ort hinzufügen</span>
                                        </Button>
                                    }
                                />
                                <CreateEventDialog groups={[group]} defaultGroupId={id} places={places || []} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Actions Bar */}
                    <div className="sky-card p-4 flex items-center justify-between">
                        <div className="flex gap-4">
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-primary hover:bg-blue-50">
                                <Calendar className="w-4 h-4" /> Events
                            </Button>
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-primary hover:bg-blue-50">
                                <Users className="w-4 h-4" /> Mitglieder
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            {isMember && (
                                <CreateEventDialog
                                    groups={[group]}
                                    defaultGroupId={id}
                                    places={places || []}
                                />
                            )}
                            <div>
                                {!isMember ? (
                                    <GroupJoinButton groupId={id} />
                                ) : (
                                    <div className="flex gap-2">
                                        {isAdmin && (
                                            <Button variant="outline" className="border-2 border-slate-100 text-slate-600 rounded-xl">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {!isAdmin && (
                                            <GroupLeaveButton groupId={id} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Events Preview */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Kommende Events
                        </h2>
                        {upcomingEvents.length === 0 ? (
                            <div className="sky-card p-8 text-center text-slate-400">
                                Noch keine Events geplant.
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
                                        <div className="sky-card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                                            <h3 className="font-bold text-slate-800 mb-2 truncate">{event.title}</h3>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(event.start_time).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <div className="flex -space-x-1.5">
                                                    {event.event_attendees?.filter((a: any) => a.status === 'going').slice(0, 3).map((a: any, idx: number) => (
                                                        <div key={idx} className="w-5 h-5 rounded-full bg-green-100 border-2 border-white text-[8px] flex items-center justify-center font-bold text-green-600" />
                                                    ))}
                                                </div>
                                                {event.event_attendees?.filter((a: any) => a.status === 'going').length > 0 && (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {event.event_attendees.filter((a: any) => a.status === 'going').length} dabei
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

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
                    <div className="sky-card p-6">
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
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${isFounder
                                                ? 'bg-amber-100 text-amber-600 border-amber-300'
                                                : member.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-600 border-purple-200'
                                                    : 'bg-blue-100 text-blue-600 border-blue-200'
                                                }`}>
                                                {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || '?'}
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
                                                    {isFounder ? '👑 Gründer' : member.role === 'admin' ? '⭐ Admin' : '👤 Mitglied'}
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
