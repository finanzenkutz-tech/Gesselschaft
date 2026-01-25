'use server'

import { parseStringPromise } from 'xml2js'

export async function searchBGGGames(query: string) {
    if (!query || query.length < 3) return []

    try {
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`)
        const xml = await response.text()
        const result = await parseStringPromise(xml)

        const items = result.items?.item || []
        return items.map((item: any) => ({
            bggId: item.$.id,
            name: item.name[0].$.value,
            yearPublished: item.yearpublished?.[0].$.value || '?'
        })).slice(0, 10)
    } catch (error) {
        console.error('BGG Search Error:', error)
        return []
    }
}

export async function getBGGGameDetails(bggId: string) {
    try {
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`)
        const xml = await response.text()
        const result = await parseStringPromise(xml)

        const item = result.items?.item?.[0]
        if (!item) return null

        return {
            bggId: item.$.id,
            name: item.name.find((n: any) => n.$.type === 'primary')?.$.value || item.name[0].$.value,
            description: item.description[0],
            imageUrl: item.image?.[0],
            thumbnailUrl: item.thumbnail?.[0],
            minPlayers: item.minplayers[0].$.value,
            maxPlayers: item.maxplayers[0].$.value,
            playingTime: item.playingtime[0].$.value,
            minAge: item.minage[0].$.value,
            complexity: item.statistics[0].ratings[0].averageweight[0].$.value,
            rating: item.statistics[0].ratings[0].average[0].$.value,
            yearPublished: item.yearpublished[0].$.value
        }
    } catch (error) {
        console.error('BGG Details Error:', error)
        return null
    }
}
