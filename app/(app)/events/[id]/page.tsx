import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft, Check, X, HelpCircle, Dice5 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { upsertRSVP } from '@/app/events/rsvp-actions'
import { CarpoolingWidget } from '@/components/events/carpooling-widget'
import { EventChatWidget } from '@/components/events/event-chat-widget'
import { getMessages } from '@/app/events/chat-actions'
import { GameTrackingWidget } from '@/components/events/game-tracking-widget'
import { getEventSessions } from '@/app/events/session-actions'
import { EventContributionsWidget } from '@/components/events/event-contributions-widget'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calendar className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3">
                            {event.groups?.name || 'Gruppe'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{event.title}</h1>
                    </div>
                </div>

                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Datum & Zeit</p>
                                <p className="text-slate-700 font-bold text-lg">{formatDate(event.start_time)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-secondary flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Ort</p>
                                <p className="text-slate-700 font-bold text-lg">{event.location || 'Ort folgt'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <p className="text-center text-slate-500 font-bold text-sm mb-2">Bist du dabei?</p>
                        <div className="grid grid-cols-3 gap-3">
                            <form action={async () => { 'use server'; await upsertRSVP(id, 'going') }}>
                                <Button
                                    className={`w-full h-12 rounded-xl font-bold flex flex-col gap-1 ${userRSVP?.status === 'going' ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-green-200 hover:text-green-500'}`}
                                >
                                    <Check className="w-5 h-5" />
                                    <span className="text-[10px]">Dabei</span>
                                </Button>
                            </form>
                            <form action={async () => { 'use server'; await upsertRSVP(id, 'maybe') }}>
                                <Button
                                    className={`w-full h-12 rounded-xl font-bold flex flex-col gap-1 ${userRSVP?.status === 'maybe' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-yellow-200 hover:text-yellow-500'}`}
                                >
                                    <HelpCircle className="w-5 h-5" />
                                    <span className="text-[10px]">Vielleicht</span>
                                </Button>
                            </form>
                            <form action={async () => { 'use server'; await upsertRSVP(id, 'not_going') }}>
                                <Button
                                    className={`w-full h-12 rounded-xl font-bold flex flex-col gap-1 ${userRSVP?.status === 'not_going' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-red-200 hover:text-red-500'}`}
                                >
                                    <X className="w-5 h-5" />
                                    <span className="text-[10px]">Nein</span>
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <section className="sky-card p-8 space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <Dice5 className="w-6 h-6 text-primary" />
                            Beschreibung
                        </h2>
                        <div className="text-slate-600 leading-relaxed font-medium">
                            {event.description || 'Keine Beschreibung vorhanden.'}
                        </div>
                    </section>

                    {/* Integration of Carpooling Widget */}
                    <CarpoolingWidget
                        eventId={id}
                        carpools={event.carpooling || []}
                        userId={user?.id}
                    />

                    {/* Mitbringliste Slot */}
                    <EventContributionsWidget
                        eventId={id}
                        contributions={contributions || []}
                        userId={user?.id}
                    />

                    {/* Game Tracking Widget */}
                    <GameTrackingWidget
                        eventId={id}
                        sessions={sessions as any}
                        attendees={attendees as any}
                        userId={user?.id}
                    />

                    {/* Event Chat */}
                    <EventChatWidget
                        eventId={id}
                        initialMessages={messages as any}
                        userId={user?.id}
                    />
                </div>

                <aside className="sky-card p-8">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-secondary" />
                        Teilnehmer ({goingCount})
                    </h3>
                    <div className="space-y-4">
                        {attendees.filter((a: any) => a.status === 'going').map((attendee: any) => (
                            <div key={attendee.user_id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold border border-blue-100">
                                    {attendee.profiles?.full_name?.[0] || attendee.profiles?.email?.[0] || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{attendee.profiles?.full_name || attendee.profiles?.email.split('@')[0]}</p>
                                    <p className="text-[10px] text-green-500 font-bold uppercase">Dabei</p>
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
                                    <div key={attendee.user_id} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400" title={attendee.profiles?.full_name}>
                                        {attendee.profiles?.full_name?.[0] || '?'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}
