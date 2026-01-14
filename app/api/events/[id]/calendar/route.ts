import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data: event, error } = await supabase
        .from('events')
        .select('*, groups(name)')
        .eq('id', id)
        .single()

    if (error || !event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const startDate = new Date(event.start_time)
    const endDate = event.end_time ? new Date(event.end_time) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // Default 3h

    const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Board Game Hub//Event Calendar//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@boardgamehub.local
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || 'Spieleabend'}
LOCATION:${event.location || 'TBD'}
ORGANIZER:${event.groups?.name || 'Board Game Hub'}
END:VEVENT
END:VCALENDAR`

    return new NextResponse(icsContent, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`
        }
    })
}
