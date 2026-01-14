'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Promotes the next person from waitlist when someone cancels
 */
export async function promoteFromWaitlist(eventId: string) {
    const supabase = await createClient()

    // Get event details
    const { data: event } = await supabase
        .from('events')
        .select('max_players')
        .eq('id', eventId)
        .single()

    if (!event?.max_players) return { promoted: false }

    // Count current "going" attendees
    const { count: goingCount } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going')

    // If there's room, promote from waitlist
    if (goingCount !== null && goingCount < event.max_players) {
        const { data: waitlisted } = await supabase
            .from('event_attendees')
            .select('user_id, profiles(full_name, email)')
            .eq('event_id', eventId)
            .eq('status', 'waitlist')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        if (waitlisted) {
            // Promote to going
            await supabase
                .from('event_attendees')
                .update({ status: 'going' })
                .eq('event_id', eventId)
                .eq('user_id', waitlisted.user_id)

            // Create notification for the promoted user
            await supabase
                .from('notifications')
                .insert({
                    user_id: waitlisted.user_id,
                    type: 'waitlist_promoted',
                    title: 'Du bist dabei! 🎉',
                    message: 'Ein Platz ist frei geworden und du wurdest von der Warteliste nachgerückt!',
                    link: `/events/${eventId}`
                })

            revalidatePath(`/events/${eventId}`)
            return { promoted: true, userId: waitlisted.user_id }
        }
    }

    return { promoted: false }
}

/**
 * Join waitlist if event is full
 */
export async function joinWaitlist(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_attendees')
        .upsert({
            event_id: eventId,
            user_id: user.id,
            status: 'waitlist'
        }, { onConflict: 'event_id,user_id' })

    if (error) {
        console.error('Error joining waitlist:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

/**
 * Cancel attendance and trigger waitlist promotion
 */
export async function cancelAttendance(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Update status to not_going
    const { error } = await supabase
        .from('event_attendees')
        .update({ status: 'not_going' })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error canceling:', error)
        return { success: false, error: error.message }
    }

    // Trigger waitlist promotion
    await promoteFromWaitlist(eventId)

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

/**
 * Get waitlist position for a user
 */
export async function getWaitlistPosition(eventId: string, userId: string) {
    const supabase = await createClient()

    const { data: waitlisted } = await supabase
        .from('event_attendees')
        .select('user_id, created_at')
        .eq('event_id', eventId)
        .eq('status', 'waitlist')
        .order('created_at', { ascending: true })

    if (!waitlisted) return null

    const position = waitlisted.findIndex(w => w.user_id === userId)
    return position >= 0 ? position + 1 : null
}
