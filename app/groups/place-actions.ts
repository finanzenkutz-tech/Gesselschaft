'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addGroupPlace(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const groupId = formData.get('group_id') as string
    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const services = formData.get('services') as string

    const { error } = await supabase
        .from('group_places')
        .insert({
            group_id: groupId,
            name,
            address: address || null,
            services: services || null,
            created_by: user.id
        })

    if (error) {
        console.error('Error adding place:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}

export async function deleteGroupPlace(placeId: string, groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('group_places')
        .delete()
        .eq('id', placeId)

    if (error) {
        console.error('Error deleting place:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}
