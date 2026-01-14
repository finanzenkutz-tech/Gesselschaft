'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const title = formData.get('title') as string
    const groupId = formData.get('group_id') as string
    const description = formData.get('description') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const location = formData.get('location') as string

    const recurrence = formData.get('recurrence') as string

    // Prepare events array
    const eventsToCreate = []
    const baseStartTime = new Date(startTime)
    const baseEndTime = endTime ? new Date(endTime) : null

    const iterations = recurrence === 'weekly' ? 8 : 1 // Generate 8 weeks if weekly

    // Create first event (master) or single event
    // To handle "Series", we could create the first one, get its ID, then use that as parent. 
    // But for batch insert efficiency we might just loop. 
    // Let's loop and create objects.

    for (let i = 0; i < iterations; i++) {
        const currentStart = new Date(baseStartTime)
        currentStart.setDate(baseStartTime.getDate() + (i * 7))

        let currentEnd = null
        if (baseEndTime) {
            currentEnd = new Date(baseEndTime)
            currentEnd.setDate(baseEndTime.getDate() + (i * 7))
        }

        eventsToCreate.push({
            title: i > 0 ? `${title} (Woche ${i + 1})` : title, // Maybe just keep title same? "Catan Abend" is fine for all.
            // Actually, keep title same.
            // title,
            // But wait, user might want to distinguish.
            // "Jeden Montag 17:00" -> Title "Spieleabend".
            // Let's keep title identical.
            title,
            group_id: groupId,
            description,
            start_time: currentStart.toISOString(),
            end_time: currentEnd?.toISOString() || null,
            location,
            created_by: user.id,
            // Add recurrence metadata if we want (e.g. is_recurring=true for all)
            is_recurring: recurrence === 'weekly',
            recurrence_pattern: recurrence === 'weekly' ? 'WEEKLY' : null
        })
    }

    // Insert events
    const { data: createdEvents, error } = await supabase
        .from('events')
        .insert(eventsToCreate)
        .select()

    if (error) {
        console.error('Error creating event(s):', error)
        return { success: false, error: error.message }
    }

    const firstEvent = createdEvents[0]

    // Automatically add creator as an attendee for ALL created events
    const attendees = createdEvents.map(event => ({
        event_id: event.id,
        user_id: user.id,
        status: 'going'
    }))

    await supabase.from('event_attendees').insert(attendees)

    // Notify group members (Just once for the series/first event to avoid spam)
    const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

    if (members) {
        const { createNotification } = await import('@/app/notifications/actions')
        const { data: group } = await supabase.from('groups').select('name').eq('id', groupId).single()

        for (const member of members) {
            if (member.user_id !== user.id) {
                const msg = recurrence === 'weekly'
                    ? `Eine neue Eventserie "${title}" (8 Termine) wurde erstellt.`
                    : `In ${group?.name || 'deiner Gruppe'} wurde das Event "${title}" erstellt.`

                await createNotification(
                    member.user_id,
                    'event_invite',
                    'Neues Event geplant!',
                    msg,
                    `/events/${firstEvent.id}`
                )
            }
        }
    }

    revalidatePath('/events')
    revalidatePath(`/groups/${groupId}`)

    return { success: true, event: firstEvent }
}
