'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/app/notifications/actions'

export async function sendBuddyRequest(buddyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('buddies')
        .insert({
            user_id: user.id,
            buddy_id: buddyId,
            status: 'pending'
        })

    if (error) return { success: false, error: error.message }

    // Notify the buddy
    await createNotification(
        buddyId,
        'buddy_request',
        'Neue Freundschaftsanfrage',
        `Jemand möchte dein Buddy werden!`,
        '/profile'
    )

    return { success: true }
}

export async function acceptBuddyRequest(requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('buddies')
        .update({ status: 'accepted' })
        .eq('id', requestId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/profile')
    return { success: true }
}

export async function getBuddies() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('buddies')
        .select(`
            *,
            user:profiles!buddies_user_id_fkey(*),
            buddy:profiles!buddies_buddy_id_fkey(*)
        `)
        .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`)
        .eq('status', 'accepted')

    return data || []
}

export async function getPendingBuddyRequests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('buddies')
        .select(`
            *,
            sender:profiles!buddies_user_id_fkey(*)
        `)
        .eq('buddy_id', user.id)
        .eq('status', 'pending')

    return data || []
}

export async function rejectBuddyRequest(requestId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('buddies')
        .delete()
        .eq('id', requestId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/profile')
    return { success: true }
}
