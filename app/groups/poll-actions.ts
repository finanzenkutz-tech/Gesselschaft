'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/app/notifications/actions'

export async function createPoll(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const groupId = formData.get('group_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const dateOptions = formData.getAll('date_options') as string[]

    // Create poll
    const { data: poll, error: pollError } = await supabase
        .from('event_polls')
        .insert({
            group_id: groupId,
            title,
            description,
            created_by: user.id
        })
        .select()
        .single()

    if (pollError) {
        console.error('Error creating poll:', pollError)
        return { success: false, error: pollError.message }
    }

    // Create date options
    const optionsToInsert = dateOptions.map(date => ({
        poll_id: poll.id,
        date_option: new Date(date).toISOString()
    }))

    const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert)

    if (optionsError) {
        console.error('Error creating poll options:', optionsError)
        return { success: false, error: optionsError.message }
    }

    // Notify group members
    const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

    if (members) {
        for (const member of members) {
            if (member.user_id === user.id) continue;
            await createNotification(
                member.user_id,
                'poll_created',
                'Neue Umfrage in der Gruppe',
                `Eine neue Umfrage "${title}" wurde erstellt.`,
                `/groups/${groupId}`
            )
        }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true, pollId: poll.id }
}

export async function votePoll(optionId: string, voteType: 'yes' | 'maybe' | 'no') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('poll_votes')
        .upsert({
            option_id: optionId,
            user_id: user.id,
            vote_type: voteType
        }, { onConflict: 'option_id,user_id' })

    if (error) {
        console.error('Error voting:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/groups')
    return { success: true }
}

export async function closePoll(pollId: string, decidedOptionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Get the decided date
    const { data: option } = await supabase
        .from('poll_options')
        .select('date_option')
        .eq('id', decidedOptionId)
        .single()

    const { error } = await supabase
        .from('event_polls')
        .update({
            status: 'decided',
            decided_date: option?.date_option
        })
        .eq('id', pollId)
        .eq('created_by', user.id)

    if (error) {
        console.error('Error closing poll:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/groups')
    return { success: true }
}

export async function getPollsForGroup(groupId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('event_polls')
        .select(`
            *,
            profiles(full_name, avatar_url),
            poll_options(
                id,
                date_option,
                poll_votes(user_id, vote_type, profiles(full_name))
            )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching polls:', error)
        return []
    }

    return data || []
}
