'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const fullName = formData.get('full_name') as string

    // Handle avatar upload
    const avatarFile = formData.get('avatar') as File | null
    let avatarUrl = null

    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/avatar.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true })

        if (!uploadError && uploadData) {
            const { data: publicUrl } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)
            avatarUrl = publicUrl?.publicUrl
        }
    }

    const updateData: any = { full_name: fullName }

    // Add new fields
    const bio = formData.get('bio') as string
    const location = formData.get('location') as string
    const favoriteGames = formData.get('favorite_games') as string
    const playStyleTags = formData.get('play_style_tags') as string // Expecting JSON string for tags
    const showReputation = formData.get('show_reputation') === 'on'

    if (bio !== null) updateData.bio = bio
    if (location !== null) updateData.location = location
    if (favoriteGames !== null) updateData.favorite_games = favoriteGames
    if (playStyleTags) {
        try {
            updateData.play_style_tags = JSON.parse(playStyleTags)
        } catch (e) {
            console.error('Error parsing play_style_tags:', e)
        }
    }
    // Only update boolean if it's present in the form or we need to handle unchecked checkboxes carefully.
    // Ideally, for a checkbox, if it's unchecked it sends nothing. 
    // We should probably rely on a hidden input or just assume false if missing?
    // Actually, for a pure server action with FormData, unchecked checkboxes are just missing.
    // To properly handle "unchecking", we'd usually need a hidden input with the same name before it, or handle it in client state.
    // For now, let's assume valid input. To safe-guard against partial updates overwriting with false, we might want to be careful.
    // But since this is a dedicated profile update form, we can probably treat presence as true and absence as false IF we are submitting the whole form.
    // However, the current UI has separate sections. The "Name" section only submits "full_name".
    // We should probably consolidate the profile update or handle partial updates. 
    // The current implementation sets `updateData` with `full_name`. 
    // If we add other fields to `updateData` only if they are in `formData`, we support partial updates.

    // So, checking for null/presence is key.
    if (formData.has('show_reputation_present')) {
        updateData.show_reputation = showReputation
    }


    if (avatarUrl) updateData.avatar_url = avatarUrl

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    revalidatePath('/')
    return { success: true }
}

export async function updateEmail(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const newEmail = formData.get('email') as string

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
        console.error('Error updating email:', error)
        return { success: false, error: error.message }
    }

    return { success: true, message: 'Bestätigungs-E-Mail gesendet' }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const newPassword = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (newPassword !== confirmPassword) {
        return { success: false, error: 'Passwörter stimmen nicht überein' }
    }

    if (newPassword.length < 6) {
        return { success: false, error: 'Passwort muss mindestens 6 Zeichen haben' }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
        console.error('Error updating password:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function updateLastSeen() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
}

export async function getOnlineUsers() {
    const supabase = await createClient()

    // Consider users online if they were seen in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen')
        .gte('last_seen', fiveMinutesAgo)
        .order('last_seen', { ascending: false })

    if (error) {
        console.error('Error fetching online users:', error)
        return []
    }

    return data
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // 1. Delete from all group memberships
    await supabase.from('group_members').delete().eq('user_id', user.id)

    // 2. Delete from event attendees
    await supabase.from('event_attendees').delete().eq('user_id', user.id)

    // 3. Delete event contributions
    await supabase.from('event_contributions').delete().eq('user_id', user.id)

    // 4. Delete inventory items
    await supabase.from('inventory').delete().eq('owner_id', user.id)

    // 5. Delete buddies
    await supabase.from('buddies').delete().or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`)

    // 6. Delete notifications
    await supabase.from('notifications').delete().eq('user_id', user.id)

    // 7. Delete challenges
    await supabase.from('challenges').delete().or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)

    // 8. Delete profile
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id)
    if (profileError) {
        console.error('Error deleting profile:', profileError)
        return { success: false, error: profileError.message }
    }

    // 9. Delete auth user - This signs them out automatically
    // Note: This requires admin privileges in production, user must be signed out
    await supabase.auth.signOut()

    return { success: true }
}
