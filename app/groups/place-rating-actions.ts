'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function ratePlace(placeId: string, rating: number, comment?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    if (rating < 1 || rating > 5) return { success: false, error: 'Ungültige Bewertung' }

    const { error } = await supabase
        .from('place_ratings')
        .upsert({
            place_id: placeId,
            user_id: user.id,
            rating,
            comment: comment || null
        })

    if (error) {
        console.error('Error rating place:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups`) // Need more specific path if possible
    return { success: true }
}

export async function getPlaceRatings(placeId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('place_ratings')
        .select(`
            *,
            user:profiles(full_name, avatar_url)
        `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}
