'use server'

import { createClient } from '@/lib/supabase/server'

export type AdvisorCriteria = {
    playerCount: number
    duration: 'short' | 'medium' | 'long' | 'any' // <60, 60-120, >120
    complexity: 'light' | 'medium' | 'heavy' | 'any' // <2, 2-3.5, >3.5
    mood: 'fun' | 'strategy' | 'coop' | 'any'
    groupId?: string
}

export type Recommendation = {
    gameId: string
    name: string
    imageUrl: string | null
    matchScore: number
    reason: string
    specs: {
        players: string
        time: string
        weight: string
    }
}

export async function getRecommendations(criteria: AdvisorCriteria): Promise<Recommendation[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Fetch available games
    // Ideally from the user's inventory OR the selected group's aggregated inventory
    let query = supabase
        .from('inventory')
        .select('*')

    if (criteria.groupId) {
        // If group selected, get games from all group members (complex query, distinct by name/bgg_id)
        // Simplified: Get games where owner is in the group.
        // For this prototype, we stick to user's inventory + games explicitly shared with user's groups
        // Or simpler: Just user's inventory for now to keep it fast.
        query = query.eq('owner_id', user.id)
    } else {
        // Just my games
        query = query.eq('owner_id', user.id)
    }

    const { data: games } = await query

    if (!games || games.length === 0) return []

    // 2. Score Games
    const scoredGames = games.map(game => {
        let score = 0
        const reasons: string[] = []

        // Player Count (Critical)
        const min = game.min_players || 1
        const max = game.max_players || 99
        if (criteria.playerCount >= min && criteria.playerCount <= max) {
            score += 100 // Hard requirement met
            if (criteria.playerCount === game.best_player_count) { // Hypothetical field
                score += 20
                reasons.push("Optimale Spielerzahl")
            }
        } else {
            return null // Filter out
        }

        // Duration
        const time = game.playtime || 60
        if (criteria.duration === 'short' && time <= 60) { score += 50; reasons.push("Passt zeitlich perfekt (kurz)") }
        else if (criteria.duration === 'medium' && time > 60 && time <= 120) { score += 50; reasons.push("Passt zeitlich perfekt (mittel)") }
        else if (criteria.duration === 'long' && time > 120) { score += 50; reasons.push("Ein abendfüllendes Erlebnis") }
        else if (criteria.duration !== 'any') { score -= 20; reasons.push("Zeitlich vielleicht nicht optimal") }

        // Complexity
        const weight = Number(game.complexity) || 2.5
        if (criteria.complexity === 'light' && weight < 2.5) { score += 50; reasons.push("Schön entspannt") }
        else if (criteria.complexity === 'medium' && weight >= 2.5 && weight <= 3.8) { score += 50; reasons.push("Fordert, ohne zu überfordern") }
        else if (criteria.complexity === 'heavy' && weight > 3.8) { score += 50; reasons.push("Ein echter Brain-Burner") }
        else if (criteria.complexity !== 'any') { score -= 10 }

        // Mood / Category Matching
        const category = (game.category || '').toLowerCase()
        if (criteria.mood === 'coop' && (category.includes('coop') || category.includes('kooperativ'))) { score += 60; reasons.push("Gemeinsam gewinnen!") }
        if (criteria.mood === 'strategy' && (category.includes('strategy') || weight > 3)) { score += 40; reasons.push("Strategisches Highlight") }
        if (criteria.mood === 'fun' && (category.includes('party') || category.includes('dexterity') || weight < 2)) { score += 40; reasons.push("Spaß garantiert") }

        // Pile of Shame Bonus
        if (game.is_unplayed) {
            score += 30
            reasons.push("Noch ungespielt (Pile of Shame)!")
        }

        return {
            gameId: game.id,
            name: game.name,
            imageUrl: game.image_url,
            matchScore: score,
            reason: reasons.slice(0, 2).join(' • '),
            specs: {
                players: `${min}-${max}`,
                time: `${time}m`,
                weight: weight.toFixed(1)
            }
        }
    }).filter(Boolean) as Recommendation[]

    // 3. Sort and Return Top 3
    return scoredGames.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
}
