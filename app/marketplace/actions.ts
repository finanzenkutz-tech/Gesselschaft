'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from '@/app/notifications/actions'

export async function createListing(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Nicht authentifiziert' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null
    const condition = formData.get('condition') as string
    const listingType = formData.get('listing_type') as string
    const location = formData.get('location') as string
    const gameId = formData.get('game_id') as string || null

    // Stats
    const minPlayers = formData.get('min_players') ? parseInt(formData.get('min_players') as string) : null
    const maxPlayers = formData.get('max_players') ? parseInt(formData.get('max_players') as string) : null
    const playtime = formData.get('playtime') ? parseInt(formData.get('playtime') as string) : null
    const minAge = formData.get('min_age') ? parseInt(formData.get('min_age') as string) : null
    const complexity = formData.get('complexity') ? parseFloat(formData.get('complexity') as string) : null

    // Location Coords
    const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
    const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null

    // Handle images
    const imageUrls: string[] = []
    const files = formData.getAll('images') as File[]

    for (const file of files) {
        if (file.size > 0 && file.name !== 'undefined') {
            const fileExt = file.name.split('.').pop()
            const fileName = `marketplace/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('game-images')
                .upload(fileName, file)

            if (!uploadError && uploadData) {
                const { data: publicUrl } = supabase.storage
                    .from('game-images')
                    .getPublicUrl(fileName)

                if (publicUrl) {
                    imageUrls.push(publicUrl.publicUrl)
                }
            }
        }
    }

    const { data, error } = await supabase
        .from('marketplace_listings')
        .insert({
            seller_id: user.id,
            title,
            description,
            price,
            condition,
            listing_type: listingType,
            location,
            game_id: gameId,
            images: imageUrls,
            status: 'active',
            min_players: minPlayers,
            max_players: maxPlayers,
            playtime,
            min_age: minAge,
            complexity,
            lat,
            lng,
            is_for_rent: listingType === 'rent',
            rental_period_days: formData.get('rental_period_days') ? parseInt(formData.get('rental_period_days') as string) : null
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating listing:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/marketplace')
    return { success: true, data }
}

export async function updateListing(listingId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Nicht authentifiziert' }
    }

    // Handle images
    // 1. Get kept images from existing
    let finalImages: string[] = []
    if (formData.has('kept_images')) {
        try {
            const kept = JSON.parse(formData.get('kept_images') as string)
            if (Array.isArray(kept)) finalImages = kept
        } catch (e) {
            console.error('Error parsing kept_images', e)
        }
    }

    // 2. Upload new images
    const files = formData.getAll('new_images') as File[]
    for (const file of files) {
        if (file.size > 0 && file.name !== 'undefined') {
            const fileExt = file.name.split('.').pop()
            const fileName = `marketplace/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('game-images')
                .upload(fileName, file)

            if (!uploadError && uploadData) {
                const { data: publicUrl } = supabase.storage
                    .from('game-images')
                    .getPublicUrl(fileName)

                if (publicUrl) {
                    finalImages.push(publicUrl.publicUrl)
                }
            }
        }
    }

    const updates: any = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        listing_type: formData.get('listing_type') as string,
        condition: formData.get('condition') as string,
        location: formData.get('location') as string,
        images: finalImages,
        updated_at: new Date().toISOString(),
        min_players: formData.get('min_players') ? parseInt(formData.get('min_players') as string) : null,
        max_players: formData.get('max_players') ? parseInt(formData.get('max_players') as string) : null,
        playtime: formData.get('playtime') ? parseInt(formData.get('playtime') as string) : null,
        min_age: formData.get('min_age') ? parseInt(formData.get('min_age') as string) : null,
        complexity: formData.get('complexity') ? parseFloat(formData.get('complexity') as string) : null,
        lat: formData.get('lat') ? parseFloat(formData.get('lat') as string) : null,
        lng: formData.get('lng') ? parseFloat(formData.get('lng') as string) : null,
        is_for_rent: formData.get('listing_type') === 'rent',
        rental_period_days: formData.get('rental_period_days') ? parseInt(formData.get('rental_period_days') as string) : null
    }
    if (formData.has('price')) {
        updates.price = formData.get('price') ? parseFloat(formData.get('price') as string) : null
    }

    // Handle game_id update
    if (formData.has('game_id')) {
        updates.game_id = formData.get('game_id') as string
    } else {
        updates.game_id = null
    }

    const { error } = await supabase
        .from('marketplace_listings')
        .update(updates)
        .eq('id', listingId)
        .eq('seller_id', user.id)

    if (error) {
        console.error('Error updating listing:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/marketplace')
    revalidatePath(`/marketplace/${listingId}`)
    return { success: true }
}

export async function deleteListing(listingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Nicht authentifiziert' }
    }

    const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user.id)

    if (error) {
        console.error('Error deleting listing:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/marketplace')
    redirect('/marketplace')
}

export async function markAsSold(listingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'sold' })
        .eq('id', listingId)
        .eq('seller_id', user.id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/marketplace')
    revalidatePath(`/marketplace/${listingId}`)
    return { success: true }
}

export async function markAsReserved(listingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'reserved' })
        .eq('id', listingId)
        .eq('seller_id', user.id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/marketplace')
    revalidatePath(`/marketplace/${listingId}`)
    return { success: true }
}

export async function startMarketplaceChat(listingId: string, sellerId: string, message: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    if (user.id === sellerId) {
        return { success: false, error: 'Du kannst dir selbst keine Nachricht schreiben' }
    }

    const { sendMessage } = await import('@/app/chat/actions')

    const { data: listing } = await supabase.from('marketplace_listings').select('title').eq('id', listingId).single()
    const listingTitle = listing?.title || 'Anzeige'

    const contextMessage = `[Marktplatz Anfrage: ${listingTitle}]\n${message}`

    const result = await sendMessage(sellerId, contextMessage)

    if (!result.success) {
        return { success: false, error: result.error }
    }

    redirect(`/chat/${sellerId}`)
}

export async function toggleFavorite(listingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if exists
    const { data: existing } = await supabase
        .from('marketplace_favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .single()

    if (existing) {
        // Remove
        await supabase
            .from('marketplace_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('listing_id', listingId)

        revalidatePath('/marketplace')
        revalidatePath('/marketplace/favorites')
        revalidatePath(`/marketplace/${listingId}`)
        return { success: true, isFavorite: false }
    } else {
        // Add
        await supabase
            .from('marketplace_favorites')
            .insert({ user_id: user.id, listing_id: listingId })

        revalidatePath('/marketplace')
        revalidatePath('/marketplace/favorites')
        revalidatePath(`/marketplace/${listingId}`)
        return { success: true, isFavorite: true }
    }
}

export async function reportListing(listingId: string, reason: string, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('marketplace_reports')
        .insert({
            reporter_id: user.id,
            listing_id: listingId,
            reason,
            description
        })

    if (error) {
        console.error('Error reporting listing:', error)
        return { success: false, error: 'Fehler beim Senden der Meldung.' }
    }

    return { success: true }
}

export async function createReview(reviewedUserId: string, rating: number, comment: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }
    if (user.id === reviewedUserId) return { success: false, error: 'Du kannst dich nicht selbst bewerten.' }

    const { error } = await supabase
        .from('user_reviews')
        .insert({
            reviewer_id: user.id,
            reviewed_user_id: reviewedUserId,
            rating,
            comment
        })

    if (error) {
        console.error('Error creating review:', error)
        return { success: false, error: 'Fehler beim Speichern der Bewertung.' }
    }

    revalidatePath(`/marketplace`)
    return { success: true }
}

export async function createOffer(listingId: string, amount: number, message: string, isRental: boolean = false, returnDate: string | null = null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('marketplace_offers')
        .insert({
            listing_id: listingId,
            buyer_id: user.id,
            amount,
            message,
            status: 'pending',
            is_rental_request: isRental,
            return_date: returnDate
        })
    if (error) {
        console.error('Error creating offer:', error)
        return { success: false, error: 'Fehler beim Senden des Angebots.' }
    }

    revalidatePath(`/marketplace/${listingId}`)

    // Notify seller
    const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('seller_id, title')
        .eq('id', listingId)
        .single()

    if (listing) {
        await createNotification(
            listing.seller_id,
            'marketplace_offer',
            'Neues Angebot erhalten',
            `Du hast ein Angebot für "${listing.title}" erhalten.`,
            `/marketplace/${listingId}`
        )
    }

    return { success: true }
}

export async function updateOfferStatus(offerId: string, status: 'accepted' | 'rejected' | 'cancelled') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('marketplace_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offerId)

    if (error) {
        console.error('Error updating offer:', error)
        return { success: false, error: 'Fehler beim Aktualisieren des Angebots.' }
    }

    revalidatePath('/marketplace')

    // Notify buyer
    const { data: offer } = await supabase
        .from('marketplace_offers')
        .select('buyer_id, listing_id, marketplace_listings(title)')
        .eq('id', offerId)
        .single()

    if (offer) {
        const title = (offer.marketplace_listings as any)?.title || 'dein Angebot'
        const msg = status === 'accepted' ? 'angenommen' : status === 'rejected' ? 'abgelehnt' : 'storniert'

        await createNotification(
            offer.buyer_id,
            'marketplace_offer_update',
            `Angebot ${msg}`,
            `Dein Angebot für "${title}" wurde ${msg}.`,
            `/marketplace/${offer.listing_id}`
        )
    }

    return { success: true }
}

export async function saveSearch(query: string, filters: any, label: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('marketplace_saved_searches')
        .insert({
            user_id: user.id,
            query,
            filters,
            label
        })

    if (error) {
        console.error('Error saving search:', error)
        return { success: false, error: 'Fehler beim Speichern der Suche.' }
    }

    return { success: true }
}
