'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/(app)/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

// --- BRING ITEMS ---

export async function addBringItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const eventId = formData.get('event_id') as string
    const inventoryId = formData.get('inventory_id') as string | null
    const customItem = formData.get('custom_item') as string | null

    if (!inventoryId && !customItem) {
        return { success: false, error: 'Bitte wähle ein Spiel oder gib einen Text ein.' }
    }

    const { error } = await supabase
        .from('event_brings')
        .insert({
            event_id: eventId,
            user_id: user.id,
            inventory_id: inventoryId || null, // Convert empty string to null if needed
            custom_item: customItem || null
        })

    if (error) {
        console.error('Error adding bring item:', error)
        return { success: false, error: error.message }
    }

    // Award XP for contribution (Bringing a game/item)
    // "Spiele mitbringen (+20 XP)"
    await addXP(user.id, XP_REWARDS.contribution_made || 20, 'Vielen Dank fürs Mitbringen!')

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function removeBringItem(itemId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
        .from('event_brings')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function addRequestItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const eventId = formData.get('event_id') as string
    const customItem = formData.get('custom_item') as string

    if (!customItem) {
        return { success: false, error: 'Bitte gib an, was benötigt wird.' }
    }

    const { error } = await supabase
        .from('event_brings')
        .insert({
            event_id: eventId,
            user_id: user.id, // Host (Requester)
            custom_item: customItem,
            is_request: true,
            claimed_by: null
        })

    if (error) {
        console.error('Error adding request:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function claimRequest(itemId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_brings')
        .update({ claimed_by: user.id })
        .eq('id', itemId)
        .is('claimed_by', null) // Optimistic check

    if (error) return { success: false, error: 'Konnte nicht übernommen werden (vielleicht schon weg?)' }

    // XP Award for claiming/helping?
    await addXP(user.id, 15, 'Aufgabe übernommen!')

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function unclaimRequest(itemId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('event_brings')
        .update({ claimed_by: null })
        .eq('id', itemId)
        .eq('claimed_by', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

// --- WISHES ---

export async function addWish(eventId: string, inventoryId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if already wished?
    const { data: existing } = await supabase
        .from('event_wishes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('inventory_id', inventoryId)
        .single()

    if (existing) {
        return { success: false, error: 'Bereits gewünscht.' }
    }

    const { error } = await supabase
        .from('event_wishes')
        .insert({
            event_id: eventId,
            user_id: user.id,
            inventory_id: inventoryId
        })

    if (error) {
        console.error('Error adding wish:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function removeWish(wishId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
        .from('event_wishes')
        .delete()
        .eq('id', wishId)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

// --- RESULTS (Helper to ensure sessions exist) ---

export async function ensureGameSession(eventId: string, gameName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Check if session exists for this game/event? 
    // Usually we create a NEW session every time we play.
    const { data, error } = await supabase
        .from('game_sessions')
        .insert({
            event_id: eventId,
            game_name: gameName,
            created_by: user.id
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    revalidatePath(`/events/${eventId}`)
    return { success: true, session: data }
}

