'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addContribution(eventId: string, itemName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_contributions')
        .insert({
            event_id: eventId,
            item_name: itemName,
            status: 'open'
        })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function claimContribution(contributionId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_contributions')
        .update({
            user_id: user.id,
            status: 'claimed'
        })
        .eq('id', contributionId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function releaseContribution(contributionId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_contributions')
        .update({
            user_id: null,
            status: 'open'
        })
        .eq('id', contributionId)
        .eq('user_id', user.id) // Only the claimant can release

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function deleteContribution(contributionId: string, eventId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('event_contributions')
        .delete()
        .eq('id', contributionId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}
