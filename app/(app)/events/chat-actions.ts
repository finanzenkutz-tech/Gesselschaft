'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(eventId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    if (!content || content.trim() === '') {
        return { success: false, error: 'Nachricht darf nicht leer sein' }
    }

    const { data, error } = await supabase
        .from('event_messages')
        .insert({
            event_id: eventId,
            user_id: user.id,
            content: content.trim()
        })
        .select()
        .single()

    if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
    }

    // Notify attendees
    const { data: attendees } = await supabase
        .from('event_attendees')
        .select(`
            user_id,
            profiles:user_id(notifications_enabled)
        `)
        .eq('event_id', eventId)

    if (attendees) {
        // Fetch all users who have muted the current sender
        const { data: mutes } = await supabase
            .from('user_mutes')
            .select('user_id')
            .eq('muted_user_id', user.id)

        const mutedByUserIds = new Set(mutes?.map(m => m.user_id) || [])

        const { createNotification } = await import('@/app/(app)/notifications/actions')
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()

        for (const attendee of attendees) {
            const profile = attendee.profiles as any
            const isSelf = attendee.user_id === user.id
            const notificationsEnabled = profile?.notifications_enabled !== false
            const isMuted = mutedByUserIds.has(attendee.user_id)

            if (!isSelf && notificationsEnabled && !isMuted) {
                await createNotification(
                    attendee.user_id,
                    'chat_message',
                    'Neue Chat-Nachricht',
                    `In "${event?.title}" gibt es eine neue Nachricht.`,
                    `/events/${eventId}`
                )
            }
        }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true, data }
}

export async function deleteMessage(messageId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting message:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function getMessages(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('event_messages')
        .select(`
            id,
            content,
            created_at,
            user_id,
            profiles (
                full_name,
                avatar_url
            )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return (data || []).map(msg => ({
        ...msg,
        user: msg.profiles
    }))
}

