'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const locationInput = formData.get('location') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    let latitude = null
    let longitude = null
    let location_name = null
    let is_location_public = false

    // Geocoding if location is provided
    if (locationInput && locationInput.trim().length > 0) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationInput)}&format=json&limit=1`, {
                headers: {
                    'User-Agent': 'BoardGameHub/1.0'
                }
            })
            const data = await response.json()
            if (data && data.length > 0) {
                latitude = parseFloat(data[0].lat)
                longitude = parseFloat(data[0].lon)
                location_name = data[0].name || data[0].display_name.split(',')[0] // Simple name extraction
                is_location_public = true // Default to public if location is explicitly set during creation
            }
        } catch (error) {
            console.error('Geocoding failed:', error)
            // We continue creating the group even if geocoding fails, just without location
        }
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name,
            description,
            created_by: user.id,
            latitude,
            longitude,
            location_name,
            is_location_public
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

export async function deleteGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if user is super_admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    if (profile?.system_role !== 'super_admin') {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

    if (error) {
        console.error('Error deleting group:', error)
        return { success: false, error: 'Gruppe konnte nicht gelöscht werden.' }
    }

    revalidatePath('/groups')
    return { success: true }
}
