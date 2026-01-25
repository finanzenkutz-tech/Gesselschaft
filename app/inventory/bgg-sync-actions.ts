'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

interface BGGCollectionItem {
    objectid: string
    name: string
    yearpublished: string
    image: string
    thumbnail: string
    numplays: string
    status: {
        own: string
    }
}

/**
 * Fetch BGG collection for a username
 */
export async function fetchBGGCollection(bggUsername: string): Promise<BGGCollectionItem[]> {
    try {
        const response = await fetch(
            `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(bggUsername)}&own=1&stats=1`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        )

        if (!response.ok) {
            throw new Error('BGG API error')
        }

        const xmlText = await response.text()

        // Parse XML (simple regex approach for server-side)
        const items: BGGCollectionItem[] = []
        const itemMatches = xmlText.matchAll(/<item.*?objectid="(\d+)".*?>([\s\S]*?)<\/item>/g)

        for (const match of itemMatches) {
            const objectid = match[1]
            const content = match[2]

            const name = content.match(/<name.*?>(.*?)<\/name>/)?.[1] || ''
            const yearpublished = content.match(/<yearpublished>(.*?)<\/yearpublished>/)?.[1] || ''
            const image = content.match(/<image>(.*?)<\/image>/)?.[1] || ''
            const thumbnail = content.match(/<thumbnail>(.*?)<\/thumbnail>/)?.[1] || ''
            const numplays = content.match(/<numplays>(.*?)<\/numplays>/)?.[1] || '0'
            const own = content.match(/<status.*?own="(\d)".*?\/>/)?.[1] || '0'

            if (own === '1') {
                items.push({
                    objectid,
                    name,
                    yearpublished,
                    image,
                    thumbnail,
                    numplays,
                    status: { own }
                })
            }
        }

        return items
    } catch (error) {
        console.error('Error fetching BGG collection:', error)
        return []
    }
}

/**
 * Sync BGG collection to user's inventory
 */
export async function syncBGGCollection(bggUsername: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert', imported: 0 }

    // Fetch collection from BGG
    const collection = await fetchBGGCollection(bggUsername)

    if (collection.length === 0) {
        return { success: false, error: 'Keine Spiele gefunden oder Benutzername ungültig', imported: 0 }
    }

    // Get existing games in user's inventory
    const { data: existingGames } = await supabase
        .from('inventory')
        .select('bgg_link')
        .eq('owner_id', user.id)

    const existingBggIds = new Set(
        existingGames?.map(g => g.bgg_link?.split('/').pop()).filter(Boolean) || []
    )

    // Filter out already imported games
    const newGames = collection.filter(item => !existingBggIds.has(item.objectid))

    if (newGames.length === 0) {
        return { success: true, error: null, imported: 0, message: 'Alle Spiele bereits importiert' }
    }

    // Import new games
    const gamesToInsert = newGames.map(item => ({
        name: item.name,
        owner_id: user.id,
        bgg_link: `https://boardgamegeek.com/boardgame/${item.objectid}`,
        image_url: item.image || item.thumbnail || null,
        visibility: 'groups',
        is_unplayed: parseInt(item.numplays) === 0
    }))

    const { error } = await supabase
        .from('inventory')
        .insert(gamesToInsert)

    if (error) {
        console.error('Error importing games:', error)
        return { success: false, error: error.message, imported: 0 }
    }

    // Save BGG username to profile for future syncs
    await supabase
        .from('profiles')
        .update({ bgg_username: bggUsername })
        .eq('id', user.id)

    // Award XP (10 XP per game, capped at 100 for a single import to avoid abuse?) 
    // Roadmap says "Neue Spiele einfügen: +10 XP".
    const xpAmount = Math.min(newGames.length * 10, 500) // Cap at 50 games per sync
    if (xpAmount > 0) {
        await addXP(user.id, xpAmount, `${newGames.length} Spiele importiert!`)
    }

    revalidatePath('/inventory')
    return { success: true, imported: newGames.length }
}
