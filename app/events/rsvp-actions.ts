'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertRSVP(eventId: string, status: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_attendees')
        .upsert({
            event_id: eventId,
            user_id: user.id,
            status: status
        }, { onConflict: 'event_id,user_id' })

    if (error) {
        console.error('Error upserting RSVP:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)

    return { success: true }
}
