import { createClient } from '@/lib/supabase/server'
import { Calendar, MapPin, Users, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CreateEventDialog } from '@/components/events/create-event-dialog'

export default async function EventsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: events } = await supabase
        .from('events')
        .select('*, groups(name), event_attendees(count)')
        .order('start_time', { ascending: true })

    const { data: myGroups } = await supabase
        .from('group_members')
        .select('groups(id, name)')
        .eq('user_id', user?.id)

    const groups = myGroups?.map((mg: any) => mg.groups).filter(Boolean) || []

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Events</h1>
                    <p className="text-slate-500 text-lg mt-1">Hier findest du alle geplanten Spieleabende.</p>
                </div>
                <div className="flex gap-2">
                    <CreateEventDialog groups={groups} variant="retroactive" />
                    <CreateEventDialog groups={groups} />
                </div>
            </header>

            {/* Filters Placeholder */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['Alle', 'Diese Woche', 'Meine Gruppen', 'Favoriten'].map((filter, i) => (
                    <button
                        key={filter}
                        className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${i === 0 ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100 hover:bg-blue-50'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {!events || events.length === 0 ? (
                <div className="sky-card p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 text-primary rounded-3xl flex items-center justify-center mb-6">
                        <Calendar className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Keine Events gefunden</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        Es sind zur Zeit keine Spieleabende geplant. Warum erstellst du nicht einfach selbst einen?
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <Link key={event.id} href={`/events/${event.id}`} className="group">
                            <div className="sky-card overflow-hidden h-full flex flex-col group-hover:border-primary/20 group-hover:shadow-xl transition-all">
                                {/* Card Header/Banner placeholder */}
                                <div className="h-32 bg-gradient-to-br from-blue-400 to-indigo-500 p-6 flex flex-col justify-end">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider mb-2">
                                        {event.groups?.name || 'Gruppe'}
                                    </span>
                                    <h3 className="text-xl font-bold text-white truncate">{event.title}</h3>
                                </div>

                                <div className="p-6 flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {new Date(event.start_time).toLocaleDateString('de-DE', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                            <MapPin className="w-4 h-4 text-secondary" />
                                            {event.location || 'Ort folgt'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {i}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                                                +0
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary font-bold text-sm">
                                            Details <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
