import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Dice5, Calendar, Users, Settings, UserPlus, LogOut, Plus, MapPin, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinGroup, leaveGroup } from '@/app/groups/member-actions'
import { revalidatePath } from 'next/cache'
import { GroupPlacesWidget } from '@/components/groups/group-places-widget'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import Link from 'next/link'

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*, group_members(*, profiles(*))')
        .eq('id', id)
        .single()

    if (groupError || !group) {
        console.error('Group fetch error:', groupError)
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

    const isMember = group.group_members.some((m: any) => m.user_id === user?.id)
    const isAdmin = group.group_members.some((m: any) => m.user_id === user?.id && m.role === 'admin')

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Banner */}
            <div className="relative h-64 rounded-[2.5rem] bg-gradient-to-r from-primary to-blue-600 overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:64px_64px] opacity-20" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">{group.name}</h1>
                    <p className="text-blue-100 text-lg max-w-2xl">{group.description || 'Keine Beschreibung vorhanden.'}</p>
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
                                />
                            )}
                            <div>
                                {!isMember ? (
                                    <form action={async () => { 'use server'; await joinGroup(id); revalidatePath(`/groups/${id}`) }}>
                                        <Button type="submit" className="bg-primary hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                                            <UserPlus className="w-4 h-4 mr-2" /> Beitreten
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="flex gap-2">
                                        {isAdmin && (
                                            <Button variant="outline" className="border-2 border-slate-100 text-slate-600 rounded-xl">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {!isAdmin && (
                                            <form action={async () => { 'use server'; await leaveGroup(id); revalidatePath(`/groups/${id}`) }}>
                                                <Button type="submit" variant="outline" className="border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl">
                                                    <LogOut className="w-4 h-4 mr-2" /> Verlassen
                                                </Button>
                                            </form>
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
                                        <CreateEventDialog groups={[group]} defaultGroupId={id} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingEvents.map(event => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="sky-card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                                            <h3 className="font-bold text-slate-800 mb-2 truncate">{event.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(event.start_time).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
                            Mitglieder ({group.group_members.length})
                        </h3>
                        <div className="space-y-3">
                            {group.group_members.map((member: any) => (
                                <div key={member.user_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                                        {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || '?'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-700 truncate">
                                            {member.profiles?.full_name || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {member.role === 'admin' ? '👑 Admin' : 'Mitglied'}
                                        </p>
                                    </div>
                                </div>
                            ))}
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
