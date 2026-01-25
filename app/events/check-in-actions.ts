'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

export async function checkIn(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Get current status to check if already checked in
    const { data: existingAttendee } = await supabase
        .from('event_attendees')
        .select('checked_in_at, event:events(title)')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    // Optimistic update to check in
    const { error } = await supabase
        .from('event_attendees')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Check-in error:', error)
        throw new Error('Check-in fehlgeschlagen')
    }

    // Award XP if first time checking in
    // @ts-ignore
    if (existingAttendee && !existingAttendee.checked_in_at) {
        // @ts-ignore
        const eventTitle = existingAttendee.event?.title || 'Event'
        await addXP(user.id, XP_REWARDS.event_attended, `Du hast am Event "${eventTitle}" teilgenommen!`)
    }

    revalidatePath(`/events/${eventId}`)
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function checkOut(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('event_attendees')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Check-out error:', error)
        throw new Error('Check-out fehlgeschlagen')
    }

    revalidatePath(`/events/${eventId}`)
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function getCheckedInUsers(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('event_attendees')
        .select(`
            user_id,
            checked_in_at,
            profiles (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('event_id', eventId)
        .not('checked_in_at', 'is', null)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })

    if (error) {
        console.error('Error fetching checked in users:', error)
        return []
    }

    // Flatten structure for easier consumption
    return data.map((item: any) => ({
        ...item.profiles,
        checked_in_at: item.checked_in_at
    }))
}
