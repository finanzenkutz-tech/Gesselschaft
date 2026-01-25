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

import webpush from 'web-push'

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@gamehub.de',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

export async function getVapidPublicKey() {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
    const supabase = await createClient()

    // Get all subscriptions for this user
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
        return { success: false, error: 'No subscriptions found' }
    }

    const payload = JSON.stringify({ title, body, url })

    // Send to all devices
    const results = await Promise.allSettled(subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, payload)
            return { success: true }
        } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription expired or gone, delete from DB
                await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
            throw err
        }
    }))

    const successCount = results.filter(r => r.status === 'fulfilled').length
    return { success: true, sent: successCount, total: subscriptions.length }
}
