'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function joinGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if already a member
    const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        return { success: false, error: 'Du bist bereits Mitglied' }
    }

    // Add as member
    const { error } = await supabase
        .from('group_members')
        .insert({
            group_id: groupId,
            user_id: user.id,
            role: 'member'
        })

    if (error) {
        console.error('Error joining group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    revalidatePath('/groups')
    revalidatePath('/')
    return { success: true }
}

export async function leaveGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error leaving group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    revalidatePath('/groups')
    revalidatePath('/')
    return { success: true }
}
