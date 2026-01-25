'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

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

    // Award XP for creating an event
    await addXP(user.id, XP_REWARDS.event_created, `Du hast ein neues Event "${title}" erstellt!`)

    revalidatePath('/events')
    revalidatePath(`/groups/${groupId}`)

    return { success: true, event: firstEvent }
}

export async function getUserEvents(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 1. Get user's groups
    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id)
    const groupIds = memberships?.map(m => m.group_id) || []

    if (groupIds.length === 0) return []

    // 2. Fetch events in range for these groups
    const { data, error } = await supabase
        .from('events')
        .select(`
            id, title, start_time, end_time, location, description, group_id, mood_status,
            groups:group_id (name, emoji),
            event_attendees(user_id, status)
        `)
        .in('group_id', groupIds)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching calendar events:', error)
        return []
    }

    return data.map((event: any) => ({
        ...event,
        myStatus: event.event_attendees.find((a: any) => a.user_id === user.id)?.status || null,
        attendeeCount: event.event_attendees.filter((a: any) => a.status === 'going').length
    }))
}

export async function getReviewableEvents() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 1. Get events from last 3 days where user was 'going' and end_time is passed
    const now = new Date().toISOString()
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    // We first get the attendee records
    const { data: attendances } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('status', 'going')

    if (!attendances || attendances.length === 0) return []

    const eventIds = attendances.map(a => a.event_id)

    // Then we get the actual events
    const { data: events } = await supabase
        .from('events')
        .select('id, title, end_time, group_id')
        .in('id', eventIds)
        .lt('end_time', now)
        .gt('end_time', threeDaysAgo)

    if (!events || events.length === 0) return []

    // 2. Check which ones have NO session by this user (or maybe no session at all linked to it?)
    // Let's assume we want to prompt if *I* haven't created a session OR if no session exists for it.
    // If someone else logged it, maybe prompt to "Review" the session (future feature).
    // For now: Prompt to "Log Game" if no session exists for this event.

    // Check sessions for these events
    const { data: sessions } = await supabase
        .from('game_sessions')
        .select('event_id')
        .in('event_id', events.map(e => e.id))

    const loggedEventIds = new Set(sessions?.map(s => s.event_id))

    // Filter events that have already been logged
    const unloggedEvents = events.filter(e => !loggedEventIds.has(e.id))

    // Need group and member info to open dialog?
    // We can fetch that in the component or return enough info here.
    // Let's return the events.
    if (unloggedEvents.length === 0) return []

    // Fetch minimal group info for context
    const { data: groups } = await supabase.from('groups').select('id, name').in('id', unloggedEvents.map(e => e.group_id))

    return unloggedEvents.map(e => ({
        ...e,
        groupName: groups?.find(g => g.id === e.group_id)?.name
    }))
}
