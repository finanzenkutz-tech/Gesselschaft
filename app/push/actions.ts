'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import webpush from 'web-push'

// VAPID keys should be in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@gamehub.de'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    } catch (error) {
        console.error('Failed to configure VAPID details. Push notifications will not work:', error)
    }
}

export async function subscribeToPush(subscription: {
    endpoint: string
    keys: { auth: string; p256dh: string }
}, userAgent?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
            user_agent: userAgent || null
        }, {
            onConflict: 'user_id,endpoint'
        })

    if (error) {
        console.error('Error saving push subscription:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function unsubscribeFromPush(endpoint: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint)

    if (error) {
        console.error('Error removing push subscription:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function sendPushToUser(userId: string, payload: {
    title: string
    body: string
    url?: string
    tag?: string
}) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys not configured, skipping push notification')
        return { success: false, error: 'VAPID not configured' }
    }

    const supabase = await createClient()

    const { data: subscriptions, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (fetchError || !subscriptions?.length) {
        return { success: false, error: 'Keine Subscriptions gefunden' }
    }

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.auth,
                    p256dh: sub.p256dh
                }
            }

            try {
                await webpush.sendNotification(
                    pushSubscription,
                    JSON.stringify(payload)
                )
                return { success: true }
            } catch (error: any) {
                // If subscription is invalid, remove it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', sub.id)
                }
                throw error
            }
        })
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    return { success: successCount > 0, sent: successCount, total: subscriptions.length }
}

export async function getVapidPublicKey() {
    return VAPID_PUBLIC_KEY
}
