'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/app/notifications/actions'

export async function addEventComment(eventId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_comments')
        .insert({
            event_id: eventId,
            user_id: user.id,
            content
        })

    if (error) {
        console.error('Error adding comment:', error)
        return { success: false, error: error.message }
    }

    // Notify event creator (background task)
    try {
        const { data: event } = await supabase
            .from('events')
            .select('user_id, title')
            .eq('id', eventId)
            .single()

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        if (event && event.user_id !== user.id) {
            await createNotification(
                event.user_id,
                'event_comment',
                'Neuer Kommentar',
                `${profile?.full_name || 'Jemand'} hat dein Event "${event.title}" kommentiert.`,
                `/events/${eventId}`
            )
        }
    } catch (notifyError) {
        console.error('Error notifying creator:', notifyError)
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function deleteEventComment(commentId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting comment:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}
