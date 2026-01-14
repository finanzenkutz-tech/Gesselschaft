'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const title = formData.get('title') as string
    const groupId = formData.get('group_id') as string
    const description = formData.get('description') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const location = formData.get('location') as string

    const { data: event, error } = await supabase
        .from('events')
        .insert([
            {
                title,
                group_id: groupId,
                description,
                start_time: startTime,
                end_time: endTime || null,
                location,
                created_by: user.id
            }
        ])
        .select()
        .single()

    if (error) {
        console.error('Error creating event:', error)
        return { success: false, error: error.message }
    }

    // Automatically add creator as an attendee
    await supabase.from('event_attendees').insert({
        event_id: event.id,
        user_id: user.id,
        status: 'going'
    })

    // 3. Notify group members
    const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

    if (members) {
        const { createNotification } = await import('@/app/notifications/actions')
        const { data: group } = await supabase.from('groups').select('name').eq('id', groupId).single()

        for (const member of members) {
            if (member.user_id !== user.id) {
                await createNotification(
                    member.user_id,
                    'event_invite',
                    'Neues Event geplant!',
                    `In ${group?.name || 'deiner Gruppe'} wurde das Event "${title}" erstellt.`,
                    `/events/${event.id}`
                )
            }
        }
    }

    revalidatePath('/events')
    revalidatePath(`/groups/${groupId}`)

    return { success: true, event }
}
