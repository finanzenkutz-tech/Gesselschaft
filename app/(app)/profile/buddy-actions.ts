'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/app/(app)/notifications/actions'

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

    // Notify the sender that the request was accepted
    const { data: request } = await supabase
        .from('buddies')
        .select('user_id')
        .eq('id', requestId)
        .single()

    if (request) {
        await createNotification(
            request.user_id,
            'buddy_request_accepted',
            'Buddy-Anfrage angenommen',
            `${user.user_metadata?.full_name || user.email} ist jetzt dein Buddy!`,
            '/profile'
        )
    }

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
export async function searchProfiles(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    if (!query || query.length < 2) return []

    // Search profiles (case insensitive)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, points')
        .ilike('full_name', `%${query}%`)
        .neq('id', user.id) // Don't show self
        .limit(10)

    if (error) return []

    // For each profile, check if there's a buddy relationship
    const profilesWithStatus = await Promise.all(profiles.map(async (p) => {
        const { data: relationship } = await supabase
            .from('buddies')
            .select('*')
            .or(`and(user_id.eq.${user.id},buddy_id.eq.${p.id}),and(user_id.eq.${p.id},buddy_id.eq.${user.id})`)
            .single()

        return {
            ...p,
            relationship: relationship || null
        }
    }))

    return profilesWithStatus
}

