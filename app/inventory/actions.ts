'use server'
import { SPIELELISTE } from '@/lib/spieleliste'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addGameToInventory(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const name = formData.get('name') as string
    const bggLink = formData.get('bgg_link') as string
    const groupId = formData.get('group_id') as string
    const visibility = formData.get('visibility') as string || 'private'

    // Handle image upload if present
    const imageFile = formData.get('image') as File | null
    const remoteImageUrl = formData.get('image_url_remote') as string | null
    let imageUrl = remoteImageUrl || null

    if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('game-images')
            .upload(fileName, imageFile)

        if (!uploadError && uploadData) {
            const { data: publicUrl } = supabase.storage
                .from('game-images')
                .getPublicUrl(fileName)
            imageUrl = publicUrl?.publicUrl
        }
    }

    const { data, error } = await supabase
        .from('inventory')
        .insert({
            name,
            bgg_link: bggLink || null,
            owner_id: user.id,
            group_id: groupId || null,
            visibility: visibility,
            image_url: imageUrl,
            is_unplayed: formData.get('is_unplayed') === 'true',
            complexity: formData.get('complexity') ? parseFloat(formData.get('complexity') as string) : null,
            min_players: formData.get('min_players') ? parseInt(formData.get('min_players') as string) : null,
            max_players: formData.get('max_players') ? parseInt(formData.get('max_players') as string) : null,
            playtime: formData.get('playtime') ? parseInt(formData.get('playtime') as string) : null,
            strategy_score: formData.get('strategy_score') ? parseFloat(formData.get('strategy_score') as string) : null,
            luck_score: formData.get('luck_score') ? parseFloat(formData.get('luck_score') as string) : null,
            category: formData.get('category') as string || null,
            price_new: formData.get('price_new') ? parseFloat(formData.get('price_new') as string) : null,
            price_used: formData.get('price_used') ? parseFloat(formData.get('price_used') as string) : null
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding game:', error)
        return { success: false, error: error.message }
    }

    // Auto-sync to known_games if it has a BGG ID
    const bggId = bggLink ? bggLink.split('/').pop() : null
    if (bggId && !isNaN(parseInt(bggId))) {
        // Check if already in known_games
        const { data: existing } = await supabase
            .from('known_games')
            .select('id')
            .eq('bgg_id', bggId)
            .single()

        if (!existing) {
            // Add to known_games
            await supabase.from('known_games').insert({
                bgg_id: bggId,
                name: name,
                image_url: imageUrl,
                complexity: formData.get('complexity') ? parseFloat(formData.get('complexity') as string) : null,
                min_players: formData.get('min_players') ? parseInt(formData.get('min_players') as string) : null,
                max_players: formData.get('max_players') ? parseInt(formData.get('max_players') as string) : null,
                playtime_max: formData.get('playtime') ? parseInt(formData.get('playtime') as string) : null,
                category: formData.get('category') as string || null
            })
        }
    }

    revalidatePath('/inventory')
    return { success: true, data }
}

export async function removeGameFromInventory(gameId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', gameId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error removing game:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function updateGame(gameId: string, updates: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', gameId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error updating game:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function transferGame(gameId: string, targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Update owner of the game
    const { error } = await supabase
        .from('inventory')
        .update({ owner_id: targetUserId })
        .eq('id', gameId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error transferring game:', error)
        return { success: false, error: error.message }
    }

    // Create a notification for the recipient
    const { createNotification } = await import('@/app/notifications/actions')
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: game } = await supabase.from('inventory').select('name').eq('id', gameId).single()

    if (game && profile) {
        await createNotification(
            targetUserId,
            'game_transfer',
            'Spiel übertragen bekommen! 🎲',
            `${profile.full_name} hat dir das Spiel "${game.name}" übertragen.`,
            '/inventory'
        )
    }

    revalidatePath('/inventory')
    return { success: true }
}


export async function searchKnownGames(query: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('known_games')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)
    return data || []
}

export async function getKnownGameDetails(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('known_games')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function searchSpielerliste(query: string) {
    if (!query || query.length < 2) return []
    const lowerQuery = query.toLowerCase()
    return SPIELELISTE.filter(g =>
        g.title.toLowerCase().includes(lowerQuery)
    ).map(g => ({
        id: `local-${g.rank}`,
        name: g.title,
        yearpublished: g.year.toString(),
        source: 'list',
        original: g
    }))
}
