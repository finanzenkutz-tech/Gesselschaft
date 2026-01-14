'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addEventComment(eventId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }
    if (!content.trim()) return { success: false, error: 'Kommentar darf nicht leer sein' }

    const { error } = await supabase
        .from('event_comments')
        .insert({
            event_id: eventId,
            user_id: user.id,
            content: content.trim()
        })

    if (error) {
        console.error('Error adding comment:', error)
        return { success: false, error: 'Fehler beim Senden' }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function deleteEventComment(commentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id) // Security: only delete own comments

    if (error) {
        console.error('Error deleting comment:', error)
        return { success: false, error: 'Fehler beim Löschen' }
    }

    // Since we don't know the eventId here easily without fetching, we might over-revalidate or client handles optimistically.
    // Better to return success and let client or parent refresh.
    // But revalidatePath needs a path.
    // We can fetch event_id first if strictly needed, but let's try generic refresh or passing path from component.
    return { success: true }
}
