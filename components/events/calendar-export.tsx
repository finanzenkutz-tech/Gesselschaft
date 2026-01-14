'use client'

import { useState } from 'react'
import { Calendar, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface CalendarExportProps {
    eventId: string
    eventTitle: string
    startTime: string
    location?: string
}

export function CalendarExport({ eventId, eventTitle, startTime, location }: CalendarExportProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleICSDownload = () => {
        window.location.href = `/api/events/${eventId}/calendar`
    }

    const handleGoogleCalendar = () => {
        const start = new Date(startTime)
        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000) // 3h default

        const formatGoogleDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }

        const url = new URL('https://calendar.google.com/calendar/render')
        url.searchParams.set('action', 'TEMPLATE')
        url.searchParams.set('text', eventTitle)
        url.searchParams.set('dates', `${formatGoogleDate(start)}/${formatGoogleDate(end)}`)
        if (location) url.searchParams.set('location', location)
        url.searchParams.set('details', 'Spieleabend via Board Game Hub')

        window.open(url.toString(), '_blank')
    }

    const handleOutlook = () => {
        const start = new Date(startTime)
        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)

        const url = new URL('https://outlook.live.com/calendar/0/action/compose')
        url.searchParams.set('subject', eventTitle)
        url.searchParams.set('startdt', start.toISOString())
        url.searchParams.set('enddt', end.toISOString())
        if (location) url.searchParams.set('location', location)
        url.searchParams.set('body', 'Spieleabend via Board Game Hub')

        window.open(url.toString(), '_blank')
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <Calendar className="w-4 h-4" />
                    Zum Kalender
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={handleGoogleCalendar} className="gap-2 cursor-pointer">
                    <ExternalLink className="w-4 h-4" />
                    Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOutlook} className="gap-2 cursor-pointer">
                    <ExternalLink className="w-4 h-4" />
                    Outlook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleICSDownload} className="gap-2 cursor-pointer">
                    <Download className="w-4 h-4" />
                    ICS herunterladen
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
