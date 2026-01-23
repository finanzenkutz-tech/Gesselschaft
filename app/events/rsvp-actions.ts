'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

export async function upsertRSVP(eventId: string, status: string, guestCount: number = 0) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if user was already going to avoid double XP
    const { data: existingRSVP } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    const { error } = await supabase
        .from('event_attendees')
        .upsert({
            event_id: eventId,
            user_id: user.id,
            status: status,
            guest_count: guestCount
        }, { onConflict: 'event_id,user_id' })

    if (error) {
        console.error('Error upserting RSVP:', error)
        return { success: false, error: error.message }
    }

    // Award XP if status changed to 'going' and wasn't 'going' before
    if (status === 'going' && existingRSVP?.status !== 'going') {
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
        await addXP(user.id, XP_REWARDS.event_attended, `Zusage für "${event?.title || 'ein Event'}" gespeichert!`)
    }

    revalidatePath(`/events/${eventId}`)

    return { success: true }
}
