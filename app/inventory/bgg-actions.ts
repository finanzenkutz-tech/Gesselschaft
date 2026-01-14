'use server'

/**
 * BoardGameGeek XML2 API Integration
 * Documentation: https://boardgamegeek.com/wiki/page/BGG_XML_API2
 */

import { parseStringPromise } from 'xml2js'

export type BGGSearchResult = {
    id: string
    name: string
    yearpublished?: string
}

export type BGGGameDetails = {
    id: string
    name: string
    image?: string
    thumbnail?: string
    description?: string
    minplayers?: number
    maxplayers?: number
    playingtime?: number
    yearpublished?: string
}

/**
 * Search for games on BGG by name
 */
export async function searchBGG(query: string): Promise<BGGSearchResult[]> {
    if (!query || query.length < 3) return []

    try {
        console.log(`[BGG] Searching for: ${query}`)
        // Set a timeout to avoid hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(
            `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame,boardgameexpansion`,
            {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'BoardGameHub/1.0 (contact@example.com)' // Replace with actual contact if available
                }
            }
        )
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`BGG Search API returned ${response.status}`)
        }

        const xml = await response.text()
        const result = await parseStringPromise(xml)

        if (!result || !result.items || !result.items.item) {
            console.log('[BGG] No items found in XML result')
            return []
        }

        const items = result.items.item
        console.log(`[BGG] Processing ${items.length} results`)

        return items.map((item: any) => {
            try {
                // Determine ID (from attributes)
                const id = item.$.id

                // Determine Name (often in name[0].$.value)
                let name = 'Unbekanntes Spiel'
                if (item.name && item.name[0]) {
                    name = item.name[0].$.value || item.name[0].$.value
                } else if (item.name) {
                    name = item.name.$.value || name
                }

                // Determine Year
                const yearpublished = (item.yearpublished && item.yearpublished[0])
                    ? item.yearpublished[0].$.value
                    : undefined

                return { id, name, yearpublished }
            } catch (err) {
                console.error('[BGG] Error processing item:', err, item)
                return null
            }
        }).filter(Boolean) as BGGSearchResult[]
    } catch (error) {
        console.error('[BGG] Search failed:', error)
        return []
    }
}

/**
 * Get full game details from BGG by ID
 */
export async function getBGGGameDetails(id: string): Promise<BGGGameDetails | null> {
    try {
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${id}`, {
            headers: {
                'User-Agent': 'BoardGameHub/1.0 (contact@example.com)'
            }
        })
        const xml = await response.text()
        const result = await parseStringPromise(xml)

        const item = result.items.item[0]
        if (!item) return null

        // Find the primary name
        const nameObj = item.name.find((n: any) => n.$.type === 'primary') || item.name[0]

        return {
            id: item.$.id,
            name: nameObj.$.value,
            image: item.image ? item.image[0] : undefined,
            thumbnail: item.thumbnail ? item.thumbnail[0] : undefined,
            description: item.description ? item.description[0] : '',
            minplayers: item.minplayers ? parseInt(item.minplayers[0].$.value) : undefined,
            maxplayers: item.maxplayers ? parseInt(item.maxplayers[0].$.value) : undefined,
            playingtime: item.playingtime ? parseInt(item.playingtime[0].$.value) : undefined,
            yearpublished: item.yearpublished ? item.yearpublished[0].$.value : undefined
        }
    } catch (error) {
        console.error('BGG Details fetch failed:', error)
        return null
    }
}
