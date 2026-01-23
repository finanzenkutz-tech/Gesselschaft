'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const locationInput = formData.get('location') as string
    const zipCode = formData.get('zip_code') as string
    const emoji = formData.get('emoji') as string || '🎲'

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    let latitude = null
    let longitude = null
    let location_name = null
    let is_location_public = false

    // Geocoding if location or zip is provided
    const searchQuery = zipCode || locationInput
    if (searchQuery && searchQuery.trim().length > 0) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
                headers: {
                    'User-Agent': 'BoardGameHub/1.0'
                }
            })
            const data = await response.json()
            if (data && data.length > 0) {
                latitude = parseFloat(data[0].lat)
                longitude = parseFloat(data[0].lon)
                location_name = data[0].name || data[0].display_name.split(',')[0]
                is_location_public = true
            }
        } catch (error) {
            console.error('Geocoding failed:', error)
        }
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name,
            description,
            emoji,
            zip_code: zipCode || null,
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
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Nicht authentifiziert' }

        const id = formData.get('id') as string
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const emoji = formData.get('emoji') as string
        const zipCode = formData.get('zip_code') as string

        // Location fields
        const locationName = formData.get('location_name') as string
        const latitudeStr = formData.get('latitude') as string
        const longitudeStr = formData.get('longitude') as string
        const isLocationPublicStr = formData.get('is_location_public') as string

        const updateData: any = {
            name,
            description,
            emoji,
            zip_code: zipCode || null
        }

        // Handle location updates
        // If latitude/longitude are provided, update them
        if (latitudeStr && longitudeStr) {
            updateData.latitude = parseFloat(latitudeStr)
            updateData.longitude = parseFloat(longitudeStr)
            updateData.location_name = locationName || null // Allow clearing name if lat/lng is set but name is empty? usually they go together
            updateData.is_location_public = isLocationPublicStr === 'true'
        } else {
            // Check if we specifically want to clear location (e.g. if they were explicitly sent as empty strings or a specific flag)
            // For now, if lat/lng are missing from formData, they might just not be updated, OR we might want to clear them.
            // But looking at the frontend, it sends them if they exist. 
            // If the user cleared the location in the picker, we need to send explicit nulls or empty strings.
            // Let's assume if 'latitude' key is present but empty, it means 'clear'.
            if (formData.has('latitude') && latitudeStr === '') {
                updateData.latitude = null
                updateData.longitude = null
                updateData.location_name = null
                updateData.is_location_public = false
            }
        }

        // Refined Logic based on frontend:
        // The frontend sends latitude/longitude if `location` state is not null. 
        // If `location` is null, it might NOT append them.
        // So we need to ensure the frontend appends something to indicate "clear".
        // Use a specific flag or check for empty string if the frontend sends it.

        // Let's look at how I will implement the frontend. I will make sure frontend sends empty string for clearing.
        // So:
        if (formData.has('latitude') && latitudeStr === '') {
            updateData.latitude = null
            updateData.longitude = null
            updateData.location_name = null
            updateData.is_location_public = false
        } else if (latitudeStr && longitudeStr) {
            updateData.latitude = parseFloat(latitudeStr)
            updateData.longitude = parseFloat(longitudeStr)
            updateData.location_name = locationName
            updateData.is_location_public = isLocationPublicStr === 'true'
        }


        const { error } = await supabase
            .from('groups')
            .update(updateData)
            .eq('id', id)

        if (error) {
            console.error('Error updating group:', error)
            return { success: false, error: 'Datenbankfehler: ' + error.message }
        }

        revalidatePath(`/groups/${id}`)
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in updateGroup:', e)
        return { success: false, error: 'Serverfehler: ' + (e.message || 'Unbekannter Fehler') }
    }
}

export async function deleteGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Fetch the group to check owner
    const { data: group } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .single()

    if (!group) return { success: false, error: 'Gruppe nicht gefunden' }

    // Check if user is owner or super_admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    const isOwner = group.created_by === user.id
    const isSuperAdmin = profile?.system_role === 'super_admin'

    if (!isOwner && !isSuperAdmin) {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

    if (error) {
        console.error('Error deleting group:', error)
        return { success: false, error: 'Gruppe konnte nicht gelöscht werden (evtl. noch Referenzen vorhanden).' }
    }

    revalidatePath('/groups')
    return { success: true }
}
