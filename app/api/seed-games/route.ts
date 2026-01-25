import { createClient } from '@/lib/supabase/server'
import { TOP_GERMAN_GAMES } from '@/lib/top-games-data'
import { searchBGG, getBGGGameDetails } from '@/app/(app)/inventory/bgg-actions'
import { NextResponse } from 'next/server'

export async function GET() {
    console.log('Starting seed...')
    const supabase = await createClient()
    const results = []

    for (const gameName of TOP_GERMAN_GAMES) {
        console.log(`Processing: ${gameName}`)

        // 1. Search BGG
        const searchResults = await searchBGG(gameName)
        if (!searchResults || searchResults.length === 0) {
            console.log(`No results for ${gameName}`)
            results.push({ name: gameName, status: 'Not found' })
            continue
        }

        const bestMatch = searchResults[0] // Assume first is best
        console.log(`Found: ${bestMatch.name} (${bestMatch.id})`)

        // Check if already exists to skip
        const { data: existing } = await supabase
            .from('known_games')
            .select('id')
            .eq('bgg_id', bestMatch.id)
            .single()

        if (existing) {
            console.log(`Already exists: ${bestMatch.name}`)
            results.push({ name: gameName, status: 'Skipped (Exists)' })
            continue
        }

        // 2. Get Details
        const details = await getBGGGameDetails(bestMatch.id)
        if (!details) {
            console.log(`Failed to get details for ${bestMatch.id}`)
            results.push({ name: gameName, status: 'Error (Details)' })
            continue
        }

        // 3. Insert
        const { error } = await supabase.from('known_games').insert({
            bgg_id: details.id,
            name: details.name, // Use BGG name or our German name? Use BGG for consistency, or maybe our list? BGG often has English names.
            // Actually, keep the German name from our list if BGG name is English? 
            // Better to us BGG name but maybe store "local_name"? 
            // Let's just use details.name for now.
            image_url: details.image,
            thumbnail_url: details.thumbnail,
            description: details.description,
            min_players: details.minplayers,
            max_players: details.maxplayers,
            playtime_min: details.playingtime, // simplified
            playtime_max: details.playingtime,
            year_published: details.yearpublished ? parseInt(details.yearpublished) : null,
            complexity: details.complexity,
            rating: details.rating,
            is_top_100: true
        })

        if (error) {
            console.error('Insert error:', error)
            results.push({ name: gameName, status: `Error: ${error.message}` })
        } else {
            results.push({ name: gameName, status: 'Added' })
        }

        // Rate limit gentle
        await new Promise(r => setTimeout(r, 1000))
    }

    return NextResponse.json({ success: true, results })
}

