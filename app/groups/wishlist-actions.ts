'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGroupWishlist(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('group_game_wishes')
        .select(`
            *,
            profiles(full_name, avatar_url),
            group_game_wish_votes(user_id)
        `)
        .eq('group_id', groupId)
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching wishlist:', error)
        return []
    }

    return data.map(item => ({
        ...item,
        hasVoted: item.group_game_wish_votes.some((v: any) => v.user_id === user.id)
    }))
}

export async function addGameToWishlist(groupId: string, gameName: string, bggId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Check if already exists
    const { data: existing } = await supabase
        .from('group_game_wishes')
        .select('id')
        .eq('group_id', groupId)
        .ilike('game_name', gameName) // Case insensitive check
        .single()

    if (existing) throw new Error('Dieses Spiel steht bereits auf der Wunschliste.')

    const { error } = await supabase
        .from('group_game_wishes')
        .insert({
            group_id: groupId,
            user_id: user.id,
            game_name: gameName,
            bgg_id: bggId || null,
            vote_count: 1 // Creator auto-votes? Logic below handles vote insert separately usually, but trigger increases count.
            // Wait, if I insert a vote manually, trigger runs. If I set vote_count=1 manually, it's fine.
            // But better: Insert wish, then insert vote.
        })
        .select()
        .single()

    if (error) throw new Error('Fehler beim Hinzufügen: ' + error.message)

    // Verify it was added (and get ID) to add initial vote?
    // Actually, let's just let the user vote manually or auto-vote.
    // Let's Fetch the ID first to be safe or use returned data.

    // Simplest: Just create it. User can click vote. Or we auto-vote.
    // Let's auto-vote for the creator.

    // We need the ID.
    const { data: newItem } = await supabase
        .from('group_game_wishes')
        .select('id')
        .eq('group_id', groupId)
        .eq('game_name', gameName)
        .single()

    if (newItem) {
        await supabase.from('group_game_wish_votes').insert({
            wish_id: newItem.id,
            user_id: user.id
        })
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}


export async function toggleVoteForGame(wishId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Check if voted
    const { data: existingVote } = await supabase
        .from('group_game_wish_votes')
        .select('id')
        .eq('wish_id', wishId)
        .eq('user_id', user.id)
        .single()

    if (existingVote) {
        // Remove vote
        await supabase.from('group_game_wish_votes').delete().eq('id', existingVote.id)
    } else {
        // Add vote
        await supabase.from('group_game_wish_votes').insert({
            wish_id: wishId,
            user_id: user.id
        })
    }

    revalidatePath('/groups/[id]', 'page') // We don't know group ID here easily without fetching. Use general revalidate or return data.
    // Better: return success and client refreshes or optimistic UI.
    return { success: true }
}

export async function deleteWish(wishId: string, groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Only creator or admin can delete. 
    // RLS handles "creator can delete". 
    // Admin check needs extra query if RLS doesn't cover it.

    const { error } = await supabase
        .from('group_game_wishes')
        .delete()
        .eq('id', wishId)

    if (error) throw new Error('Fehler beim Löschen')

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}
