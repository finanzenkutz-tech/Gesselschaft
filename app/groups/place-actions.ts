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
    const description = formData.get('description') as string
    const imageUrl = formData.get('image_url') as string
    const isPrivate = formData.get('is_private') === 'true'
    const hostInfo = formData.get('host_info') as string

    // Parse coordinates if provided
    const latStr = formData.get('latitude') as string
    const lngStr = formData.get('longitude') as string
    const latitude = latStr ? parseFloat(latStr) : null
    const longitude = lngStr ? parseFloat(lngStr) : null

    // Parse amenities from FormData
    const amenitiesJson = formData.get('amenities') as string
    const amenities = amenitiesJson ? JSON.parse(amenitiesJson) : []

    const { error } = await supabase
        .from('group_places')
        .insert({
            group_id: groupId,
            name,
            address: address || null,
            services: services || null,
            description: description || null,
            latitude,
            longitude,
            amenities,
            image_url: imageUrl || null,
            is_private: isPrivate,
            host_info: hostInfo || null,
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

export async function updateGroupPlace(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const placeId = formData.get('id') as string
    const groupId = formData.get('group_id') as string
    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const services = formData.get('services') as string
    const description = formData.get('description') as string
    const imageUrl = formData.get('image_url') as string
    const isPrivate = formData.get('is_private') === 'true'
    const hostInfo = formData.get('host_info') as string

    const latStr = formData.get('latitude') as string
    const lngStr = formData.get('longitude') as string
    const latitude = latStr ? parseFloat(latStr) : null
    const longitude = lngStr ? parseFloat(lngStr) : null

    const amenitiesJson = formData.get('amenities') as string
    const amenities = amenitiesJson ? JSON.parse(amenitiesJson) : []

    const { error } = await supabase
        .from('group_places')
        .update({
            name,
            address: address || null,
            services: services || null,
            description: description || null,
            latitude,
            longitude,
            amenities,
            image_url: imageUrl || null,
            is_private: isPrivate,
            host_info: hostInfo || null
        })
        .eq('id', placeId)

    if (error) {
        console.error('Error updating place:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}
