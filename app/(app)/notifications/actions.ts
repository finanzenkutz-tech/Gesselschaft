'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

    return data || []
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient()
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
}

export async function markAllAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
}

// Internal helper to create a notification
export async function createNotification(userId: string, type: string, title: string, message?: string, link?: string) {
    const supabase = await createClient()

    // Fetch user preferences
    const { data: profile } = await supabase
        .from('profiles')
        .select('pref_in_app_notifications, pref_push_notifications')
        .eq('id', userId)
        .single()

    const shouldSendInApp = profile?.pref_in_app_notifications ?? true
    const shouldSendPush = profile?.pref_push_notifications ?? true

    // 1. Create In-App Notification if enabled
    if (shouldSendInApp) {
        await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                link
            })
    }

    // 2. Try to send Push Notification if enabled (fire and forget)
    if (shouldSendPush) {
        try {
            const { sendPushToUser } = await import('@/app/(app)/push/actions')
            await sendPushToUser(userId, {
                title,
                body: message || 'Neue Benachrichtigung',
                url: link || '/',
                tag: type
            })
        } catch (e) {
            // Ignore push errors to not block the main flow
            console.error('Failed to trigger push notification:', e)
        }
    }
}

