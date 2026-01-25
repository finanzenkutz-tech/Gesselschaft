'use client'

import { useState, useEffect } from 'react'
import { getUserEvents } from '@/app/(app)/events/actions'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAutoAnimate } from '@formkit/auto-animate/react'

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [animationParent] = useAutoAnimate()

    useEffect(() => {
        async function loadEvents() {
            setLoading(true)
            const start = startOfWeek(startOfMonth(currentMonth)).toISOString()
            const end = endOfWeek(endOfMonth(currentMonth)).toISOString()
            const data = await getUserEvents(start, end)
            setEvents(data)
            setLoading(false)
        }
        loadEvents()
    }, [currentMonth])

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    })

    const selectedEvents = selectedDate
        ? events.filter(e => isSameDay(new Date(e.start_time), selectedDate))
        : []

    return (
        <div className="max-w-5xl mx-auto pb-20 p-4 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dein Spielkalender</h1>
                    <p className="text-slate-500 font-medium">Alle Termine deiner Gruppen im Überblick.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border shadow-sm self-start">
                    <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl h-10 w-10 p-0">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-lg font-bold w-40 text-center">
                        {format(currentMonth, 'MMMM yyyy', { locale: de })}
                    </div>
                    <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl h-10 w-10 p-0">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                {/* Calendar Grid */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
                            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                                <div key={day} className="py-4 text-center text-xs font-black uppercase text-slate-400 tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-[1px] bg-slate-50">
                            {days.map((day, idx) => {
                                const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day))
                                const isSelected = selectedDate && isSameDay(day, selectedDate)
                                const isCurrentMonth = isSameMonth(day, currentMonth)

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "min-h-[80px] p-2 flex flex-col items-center gap-1 transition-all relative group",
                                            "bg-white hover:bg-slate-50",
                                            !isCurrentMonth && "bg-slate-50/30 text-slate-300",
                                            isSelected && "ring-2 ring-primary ring-inset z-10 bg-primary/5"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all",
                                            isToday(day) ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-700",
                                            isSelected && !isToday(day) && "bg-slate-200"
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Event Dots */}
                                        <div className="flex gap-1 flex-wrap justify-center content-start w-full px-1">
                                            {dayEvents.map(ev => (
                                                <div
                                                    key={ev.id}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        ev.myStatus === 'going' ? "bg-emerald-400" : "bg-blue-400"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Selected Day Details */}
                <div className="lg:col-span-3 space-y-6" ref={animationParent}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800">
                            {selectedDate ? format(selectedDate, 'EEEE, d. MMMM', { locale: de }) : 'Kein Datum gewählt'}
                        </h2>
                        {selectedDate && isToday(selectedDate) && <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">Heute</span>}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : selectedEvents.length > 0 ? (
                        <div className="space-y-4">
                            {selectedEvents.map(event => (
                                <Link href={`/events/${event.id}`} key={event.id} className="block group">
                                    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group-hover:border-primary/20 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary group-hover:w-2 transition-all" />

                                        <div className="flex items-start justify-between mb-3 pl-3">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                                                    {event.groups?.emoji} {event.groups?.name}
                                                </div>
                                                <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                                            </div>
                                            {event.myStatus === 'going' && (
                                                <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase px-2 py-1 rounded-full ml-2 shrink-0">Dabei</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pl-3">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-slate-300" />
                                                {format(new Date(event.start_time), 'HH:mm')}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                                                    <MapPin className="w-4 h-4 text-slate-300" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        {event.attendeeCount > 0 && (
                                            <div className="mt-4 pl-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                                                <div className="flex -space-x-2">
                                                    {[...Array(Math.min(3, event.attendeeCount))].map((_, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white" />
                                                    ))}
                                                </div>
                                                <span>+{event.attendeeCount} Teilnehmer</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-3xl p-8 text-center border-2 border-dashed border-slate-100">
                            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="font-bold text-slate-600">Keine Events an diesem Tag</p>
                            <p className="text-sm text-slate-400 mt-1">Wie wäre es mit einem spontaneously Spieleabend?</p>
                            <Button className="mt-6 w-full rounded-2xl" variant="outline" asChild>
                                <Link href="/groups">Gruppe wählen & planen</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

