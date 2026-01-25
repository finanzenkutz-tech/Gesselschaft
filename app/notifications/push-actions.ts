'use server'

import { createClient } from '@/lib/supabase/server'

// Note: web-push would need to be installed (npm install web-push)
// For now, we stub the functions to allow build

export async function savePushSubscription(subscription: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const p256dh = subscription.keys?.p256dh
    const auth = subscription.keys?.auth
    const endpoint = subscription.endpoint

    if (!endpoint || !p256dh || !auth) {
        return { success: false, error: 'Invalid subscription data' }
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, endpoint'
        })

    if (error) {
        console.error('Error saving subscription:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function removePushSubscription(endpoint: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .match({ user_id: user.id, endpoint })

    if (error) {
        console.error('Error deleting subscription:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
    // This would use web-push library in production
    // For now, just log and return success to allow build
    console.log('[Push] Would send notification to', userId, ':', title, body, url)
    return { success: true, message: 'Push notifications require web-push setup' }
}
