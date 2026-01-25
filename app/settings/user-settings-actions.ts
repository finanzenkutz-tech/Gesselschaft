'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateNotificationSettings(enabled: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating notification settings:', error)
        throw new Error('Einstellungen konnten nicht gespeichert werden')
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function muteUser(mutedUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('user_mutes')
        .insert({
            user_id: user.id,
            muted_user_id: mutedUserId
        })

    if (error) {
        console.error('Error muting user:', error)
        throw new Error('Nutzer konnte nicht stummgeschaltet werden')
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function unmuteUser(mutedUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('user_mutes')
        .delete()
        .eq('user_id', user.id)
        .eq('muted_user_id', mutedUserId)

    if (error) {
        console.error('Error unmuting user:', error)
        throw new Error('Stummschaltung konnte nicht aufgehoben werden')
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function getMutedUsers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('user_mutes')
        .select('muted_user_id, profiles!user_mutes_muted_user_id_fkey(full_name, avatar_url)')
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching muted users:', error)
        return []
    }

    return data.map(m => ({
        id: m.muted_user_id,
        ...(m.profiles as any)
    }))
}
