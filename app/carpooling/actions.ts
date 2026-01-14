'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function offerCarpool(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const eventId = formData.get('event_id') as string
    const seatsAvailable = parseInt(formData.get('seats_available') as string)
    const description = formData.get('description') as string

    const { data, error } = await supabase
        .from('carpooling')
        .insert({
            event_id: eventId,
            driver_id: user.id,
            seats_available: seatsAvailable,
            description: description
        })
        .select()
        .single()

    if (error) {
        console.error('Error offering carpool:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true, data }
}

export async function joinCarpool(carpoolId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if already in this carpool or another for same event? 
    // For now simple insert
    const { error } = await supabase
        .from('carpool_passengers')
        .insert({
            carpool_id: carpoolId,
            passenger_id: user.id
        })

    if (error) {
        console.error('Error joining carpool:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}

export async function leaveCarpool(carpoolId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('carpool_passengers')
        .delete()
        .eq('carpool_id', carpoolId)
        .eq('passenger_id', user.id)

    if (error) {
        console.error('Error leaving carpool:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}
