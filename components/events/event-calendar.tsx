'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Event = {
    id: string
    title: string
    start_time: string
    groups?: { name: string }
    event_attendees?: { user_id: string; status: string }[]
}

export function EventCalendar({ events, userId }: { events: Event[], userId?: string }) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1 // Monday start

    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    const getEventsForDay = (day: number) => {
        const dayDate = new Date(year, month, day)
        return events.filter(event => {
            const eventDate = new Date(event.start_time)
            return eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year
        })
    }

    const isUserAttending = (event: Event) => {
        return event.event_attendees?.some(a => a.user_id === userId && a.status === 'going')
    }

    const today = new Date()
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

    const days = []
    for (let i = 0; i < startingDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 md:h-28" />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = getEventsForDay(day)
        days.push(
            <div
                key={day}
                className={`h-24 md:h-28 p-1 md:p-2 border border-slate-50 rounded-xl transition-all hover:bg-blue-50/50 ${isToday(day) ? 'bg-blue-50 ring-2 ring-primary/20' : 'bg-white'
                    }`}
            >
                <div className={`text-xs font-bold mb-1 ${isToday(day) ? 'text-primary' : 'text-slate-400'}`}>
                    {day}
                </div>
                <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(event => {
                        const attending = isUserAttending(event)
                        return (
                            <Link href={`/events/${event.id}`} key={event.id}>
                                <div className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md truncate cursor-pointer transition-all hover:scale-[1.02] ${attending
                                    ? 'bg-green-500 text-white'
                                    : 'bg-primary/10 text-primary'
                                    }`}>
                                    {event.title}
                                </div>
                            </Link>
                        )
                    })}
                    {dayEvents.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-bold">+{dayEvents.length - 2} mehr</div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <section className="sky-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    Kalender
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-blue-50">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-bold text-slate-700 min-w-[140px] text-center">
                        {monthNames[month]} {year}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-blue-50">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 md:overflow-visible md:mx-0 md:px-0">
                <div className="grid grid-cols-7 gap-1 min-w-[600px] md:min-w-0">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
                            {day}
                        </div>
                    ))}
                    {days}
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-50 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary/10" />
                    <span className="text-slate-500 font-medium">Event</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                    <span className="text-slate-500 font-medium">Du nimmst teil</span>
                </div>
            </div>
        </section>
    )
}
