'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGroupGames(groupId: string) {
    const supabase = await createClient()

    // Fetch members of the group
    const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

    if (!members || members.length === 0) return []

    const userIds = members.map(m => m.user_id)

    // Fetch games belonging to these users, filtered by visibility
    // We want games that are NOT private, or specifically shared with groups
    const { data: games, error } = await supabase
        .from('inventory')
        .select('*, profiles:owner_id(full_name, avatar_url)')
        .in('owner_id', userIds)
        .neq('visibility', 'private')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching group games:', error)
        return []
    }

    return games
}
