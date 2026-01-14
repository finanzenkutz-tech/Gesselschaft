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
