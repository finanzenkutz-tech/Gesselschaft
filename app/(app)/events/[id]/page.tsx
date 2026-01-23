import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft, Trash2, Car, Pizza, Dice5, MessageCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CarpoolingWidget } from '@/components/events/carpooling-widget'
import { EventChatWidget } from '@/components/events/event-chat-widget'
import { getMessages } from '@/app/events/chat-actions'
import { GameTrackingWidget } from '@/components/events/game-tracking-widget'
import { getEventSessions } from '@/app/events/session-actions'
import { EventContributionsWidget } from '@/components/events/event-contributions-widget'
import { deleteAnyEvent } from '@/app/(app)/admin/actions'
import { RSVPButtons } from '@/components/events/rsvp-buttons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameSuggestions } from '@/components/events/game-suggestions'
import { CalendarExport } from '@/components/events/calendar-export'
import { SessionReportForm } from '@/components/events/session-report-form'
import { EventComments } from '@/components/events/event-comments'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user?.id)
        .single()

    const isSuperAdmin = profile?.system_role === 'super_admin'

    const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('*, groups(*), profiles(*), event_attendees(*, profiles(*)), carpooling(*, profiles(*), carpool_passengers(*))')
        .eq('id', id)
        .maybeSingle()

    if (fetchError || !event) {
        console.error('Event fetch error:', fetchError)
        return notFound()
    }

    const userRSVP = event.event_attendees.find((a: any) => a.user_id === user?.id)
    const attendees = event.event_attendees || []
    const goingCount = attendees.filter((a: any) => a.status === 'going').length
    const guestCounts = attendees.reduce((acc: number, curr: any) => acc + (curr.guest_count || 0), 0)
    const totalHeadcount = goingCount + guestCounts

    const maybeCount = attendees.filter((a: any) => a.status === 'maybe').length

    // Fetch chat messages
    const messages = await getMessages(id)

    // Fetch game sessions
    const sessions = await getEventSessions(id)

    // Fetch contributions
    const { data: contributions } = await supabase
        .from('event_contributions')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: true })

    // Fetch Group Inventory for suggestions
    const { data: groupInventory } = await supabase
        .from('inventory')
        .select('*, owner:profiles(full_name)')
        .eq('group_id', event.group_id)

    // Fetch Event Comments
    const { data: comments } = await supabase
        .from('event_comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('event_id', id)
        .order('created_at', { ascending: true })

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/events" className="inline-flex items-center text-slate-500 hover:text-primary font-bold gap-2 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Zurück zur Übersicht
            </Link>

            {/* Header Section */}
            <div className="sky-card overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary to-blue-600 p-8 md:p-12 flex flex-col justify-end text-white relative">
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                        {(isSuperAdmin || event.created_by === user?.id) && (
                            <form action={async () => {
                                'use server'
                                await deleteAnyEvent(id)
                                redirect('/events')
                            }}>
                                <Button
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none rounded-xl h-10 w-10 p-0"
                                    variant="outline"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </form>
                        )}
                        <Calendar className="w-48 h-48 opacity-10 absolute -top-10 -right-10 pointer-events-none" />
                    </div>
                    <div className="relative z-10 text-shadow-sm">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-sm border border-white/10">
                            {event.groups?.name || 'Gruppe'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">{event.title}</h1>
                    </div>
                </div>

                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shrink-0 border border-blue-100">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Datum & Zeit</p>
                                <p className="text-slate-700 font-bold text-lg">{formatDate(event.start_time)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-secondary flex items-center justify-center shrink-0 border border-sky-100">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Ort</p>
                                <p className="text-slate-700 font-bold text-lg">{event.location || 'Ort folgt'}</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex flex-col gap-4">
                    <RSVPButtons
                        eventId={id}
                        currentStatus={userRSVP?.status}
                        currentGuestCount={userRSVP?.guest_count || 0}
                    />
                    <div className="flex justify-end">
                        <CalendarExport
                            eventId={id}
                            eventTitle={event.title}
                            startTime={event.start_time}
                            location={event.location}
                        />
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-blue-50/50 rounded-2xl gap-1">
                    <TabsTrigger value="details" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <Info className="w-4 h-4 mr-2 hidden md:block" />
                        Infos
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <Pizza className="w-4 h-4 mr-2 hidden md:block" />
                        Logistik
                    </TabsTrigger>
                    <TabsTrigger value="games" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <Dice5 className="w-4 h-4 mr-2 hidden md:block" />
                        Spiele
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <MessageCircle className="w-4 h-4 mr-2 hidden md:block" />
                        Chat
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section className="sky-card p-8 space-y-4">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <Info className="w-6 h-6 text-primary" />
                                    Beschreibung
                                </h2>
                                <div className="text-slate-600 leading-relaxed font-medium">
                                    {event.description || 'Keine Beschreibung vorhanden.'}
                                </div>
                            </section>

                            <section className="sky-card p-8">
                                <EventComments
                                    eventId={id}
                                    initialComments={comments || []}
                                    currentUserId={user?.id || ''}
                                />
                            </section>
                        </div>

                        <aside className="sky-card p-8 h-fit">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-secondary" />
                                Teilnehmer ({totalHeadcount})
                            </h3>
                            <div className="space-y-4">
                                {attendees.filter((a: any) => a.status === 'going').map((attendee: any) => (
                                    <div key={attendee.user_id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold border border-blue-100 uppercase">
                                            {attendee.profiles?.full_name?.[0] || attendee.profiles?.email?.[0] || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{attendee.profiles?.full_name || attendee.profiles?.email.split('@')[0]}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-green-500 font-bold uppercase">Dabei</p>
                                                {attendee.guest_count > 0 && (
                                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded-full font-bold">+{attendee.guest_count}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {goingCount === 0 && (
                                    <p className="text-slate-400 text-sm italic">Noch keine Zusagen.</p>
                                )}
                            </div>

                            {maybeCount > 0 && (
                                <div className="mt-8 pt-8 border-t border-slate-50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vielleicht ({maybeCount})</p>
                                    <div className="flex -space-x-2">
                                        {attendees.filter((a: any) => a.status === 'maybe').map((attendee: any) => (
                                            <div key={attendee.user_id} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase" title={attendee.profiles?.full_name}>
                                                {attendee.profiles?.full_name?.[0] || '?'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>
                    </div>
                </TabsContent>

                <TabsContent value="logistics" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Mitbringliste Slot */}
                        <EventContributionsWidget
                            eventId={id}
                            contributions={contributions || []}
                            userId={user?.id}
                        />
                        {/* Integration of Carpooling Widget */}
                        <CarpoolingWidget
                            eventId={id}
                            carpools={event.carpooling || []}
                            userId={user?.id}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="games" className="mt-6 space-y-8">
                    <GameSuggestions
                        games={groupInventory || []}
                        playerCount={totalHeadcount}
                    />

                    {/* Game Tracking Widget */}
                    <GameTrackingWidget
                        eventId={id}
                        sessions={sessions as any}
                        attendees={attendees as any}
                        userId={user?.id}
                    />

                    {sessions && sessions.length > 0 && new Date(event.start_time) < new Date() && (
                        <div className="border-t border-slate-100 pt-8 mt-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Rückblick</h3>
                            <SessionReportForm
                                sessionId={sessions[0].id} // Simplified: Report for first session or need loop? Usually one report per session. Tracking widget lists sessions. 
                                attendees={attendees as any}
                                eventId={id}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="chat" className="mt-6">
                    {/* Event Chat */}
                    <EventChatWidget
                        eventId={id}
                        initialMessages={messages as any}
                        userId={user?.id}
                    />
                </TabsContent>
            </Tabs>
        </div >
    )
}
