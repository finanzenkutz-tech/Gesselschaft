import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const VAPID_PUBLIC_KEY = 'BAhQOYv8ljhQhFxe1oj6d8YWXJxKBUvjN64Abv-Cxsuw_HDi5hXXVjqWSa3AXo6-apQPjUQOGZalYu2ay5Wy8_k'
const VAPID_PRIVATE_KEY = '62ua0uCZnOM75d3METedFYTSXOyR80CqlvdAqIPUp8o'
const VAPID_SUBJECT = 'mailto:admin@gamehub.de'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
    if (!supabaseUrl || !supabaseKey) {
        return new Response('Missing Environment Variables', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const now = new Date()

    // -----------------------------------------------------------------------
    // 1. EVENT START REMINDERS (approx 24h before)
    // -----------------------------------------------------------------------
    const startRange = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const endRange = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    try {
        // --- Fetch Upcoming Events ---
        const { data: upcomingEvents, error: upcomingError } = await supabase
            .from('events')
            .select(`
                id,
                title,
                start_time,
                attendees:event_attendees(
                    user_id,
                    status
                )
            `)
            .gte('start_time', startRange.toISOString())
            .lte('start_time', endRange.toISOString())

        if (upcomingError) throw upcomingError

        let sentCount = 0

        for (const event of upcomingEvents || []) {
            const confirmedAttendees = event.attendees.filter((a: any) => a.status === 'going')

            for (const attendee of confirmedAttendees) {
                // 1. In-App Notification
                await supabase.from('notifications').insert({
                    user_id: attendee.user_id,
                    type: 'event_reminder',
                    title: 'Event-Erinnerung',
                    message: `Dein Event "${event.title}" startet morgen!`,
                    link: `/events/${event.id}`
                })

                // 2. Push Notification
                const { data: subs } = await supabase
                    .from('push_subscriptions')
                    .select('*')
                    .eq('user_id', attendee.user_id)

                if (subs && subs.length > 0) {
                    for (const sub of subs) {
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: { auth: sub.auth, p256dh: sub.p256dh }
                        }
                        const payload = JSON.stringify({
                            title: 'Bald geht es los!',
                            body: `Dein Event "${event.title}" startet morgen!`,
                            url: `/events/${event.id}`,
                            data: { url: `/events/${event.id}` }
                        })

                        try {
                            await webpush.sendNotification(pushSubscription, payload)
                            sentCount++
                        } catch (pushErr: any) {
                            console.error('Push failed', pushErr)
                            if (pushErr.statusCode === 410) {
                                await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                            }
                        }
                    }
                }
            }
        }

        // -----------------------------------------------------------------------
        // 2. CHECK-OUT REMINDERS (12-36h after END check)
        // -----------------------------------------------------------------------

        const pastStartRange = new Date(now.getTime() - 36 * 60 * 60 * 1000)
        const pastEndRange = new Date(now.getTime() - 12 * 60 * 60 * 1000)

        const { data: pastEvents, error: pastError } = await supabase
            .from('events')
            .select(`
                id,
                title,
                end_time,
                start_time,
                attendees:event_attendees(
                    user_id,
                    checked_in_at,
                    checked_out_at
                )
            `)
            // Check if event ENDED in the window. 
            // Logic: (end_time >= pastStart AND end_time <= pastEnd) OR (start_time >= pastStart AND start_time <= pastEnd)
            // For simplicity, let's just grab events in a wider range and filter in JS to avoid complex OR logic in Supabase JS client if not needed.
            // We'll use start_time as a proxy for "recent" events.
            .gte('start_time', pastStartRange.toISOString())
            .lte('start_time', now.toISOString())

        if (pastError) console.error("Error fetching past events", pastError)

        let checkoutRemindersSent = 0

        if (!pastError && pastEvents) {
            for (const event of pastEvents) {
                // Determine actual end time
                const eventEnd = event.end_time ? new Date(event.end_time) : new Date(new Date(event.start_time).getTime() + 4 * 60 * 60 * 1000)
                const hoursSinceEnd = (now.getTime() - eventEnd.getTime()) / (1000 * 60 * 60)

                // Only send if it ended between 12 and 36 hours ago
                if (hoursSinceEnd >= 12 && hoursSinceEnd <= 36) {
                    const forgottenCheckout = event.attendees.filter((a: any) => a.checked_in_at && !a.checked_out_at)

                    for (const a of forgottenCheckout) {
                        // In-App
                        await supabase.from('notifications').insert({
                            user_id: a.user_id,
                            type: 'checkout_reminder',
                            title: 'Check-out vergessen?',
                            message: `Du bist beim Event "${event.title}" noch eingecheckt.`,
                            link: `/events/${event.id}`
                        })

                        // Push
                        const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', a.user_id)
                        if (subs) {
                            for (const sub of subs) {
                                const pushSubs = { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } }
                                try {
                                    await webpush.sendNotification(pushSubs, JSON.stringify({
                                        title: 'Check-out vergessen?',
                                        body: `Bitte checke beim Event "${event.title}" noch aus!`,
                                        url: `/events/${event.id}`
                                    }))
                                    checkoutRemindersSent++
                                } catch (e: any) {
                                    if (e.statusCode === 410) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                                }
                            }
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            upcomingEventsFound: upcomingEvents?.length,
            remindersSent: sentCount,
            pastEventsFound: pastEvents?.length,
            checkoutRemindersSent
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        })
    }
})
