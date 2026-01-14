'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name,
            description,
            created_by: user.id
        })
        .select()
        .single()

    if (groupError || !group) {
        console.error('Group creation failed:', groupError)
        return { success: false, error: 'Gruppe konnte nicht erstellt werden.' }
    }

    // 2. Add creator as Admin member
    const { error: memberError } = await supabase
        .from('group_members')
        .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'admin'
        })

    if (memberError) {
        console.error('Member addition failed:', memberError)
        // Potential rollback needed here in production
    }

    revalidatePath('/groups')
    redirect(`/groups/${group.id}`)
}

export async function updateGroup(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    const { error } = await supabase
        .from('groups')
        .update({
            name,
            description,
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating group:', error)
        return { success: false, error: 'Gruppe konnte nicht aktualisiert werden.' }
    }

    revalidatePath(`/groups/${id}`)
    return { success: true }
}
