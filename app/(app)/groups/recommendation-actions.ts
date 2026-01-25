'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSmartRecommendations(groupId: string) {
    const supabase = await createClient()

    // 1. Get all games owned by group members (Pile of Shame candidates)
    // First, list members
    const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId)
    const memberIds = members?.map(m => m.user_id) || []

    if (memberIds.length === 0) return []

    // 2. Get all games EVER played by these members in this group
    // Or simpler: Get all sessions for this group
    const { data: sessions } = await supabase
        .from('game_sessions')
        .select('game_name')
        .eq('group_id', groupId)

    const playedGameNames = new Set(sessions?.map(s => s.game_name.toLowerCase().trim()))

    // 3. Get Inventory of members
    // We want unique games
    const { data: inventory } = await supabase
        .from('inventory')
        .select('name, image_url, owner_id, profiles!inner(full_name, avatar_url)')
        .in('owner_id', memberIds)

    if (!inventory) return []

    // 4. Transform and Filter
    // Candidates are games in inventory NOT in playedGameNames
    const pileOfShameCandidates = inventory.filter(item => {
        return !playedGameNames.has(item.name.toLowerCase().trim())
    })

    // Remove duplicates (e.g. multiple people own Catan)
    // We keep the first one found or maybe list who owns it
    // Logic: Group by game name
    const groupedRecommendations: Record<string, any> = {}

    pileOfShameCandidates.forEach(item => {
        const key = item.name.toLowerCase().trim()
        if (!groupedRecommendations[key]) {
            groupedRecommendations[key] = {
                name: item.name,
                imageUrl: item.image_url,
                owners: []
            }
        }
        // Force cast to any or correct type because TS inference on join can be tricky
        const profile = item.profiles as any
        groupedRecommendations[key].owners.push({
            name: profile.full_name,
            avatar: profile.avatar_url
        })
    })

    // Helper: Select Top 5 recommendations
    // Prioritize games owned by multiple people? Or random?
    // Let's take random 5 or those owned by >1 person first
    const result = Object.values(groupedRecommendations)
        .sort((a, b) => b.owners.length - a.owners.length)
        .slice(0, 5)

    return result
}
