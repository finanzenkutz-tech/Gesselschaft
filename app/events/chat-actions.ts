'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const eventId = formData.get('event_id') as string
    const content = formData.get('content') as string

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
        .select('user_id')
        .eq('event_id', eventId)

    if (attendees) {
        const { createNotification } = await import('@/app/notifications/actions')
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()

        for (const attendee of attendees) {
            if (attendee.user_id !== user.id) {
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

export async function getMessages(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('event_messages')
        .select('*, profiles(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data
}
