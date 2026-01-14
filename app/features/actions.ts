'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFeatureRequest(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!title || title.trim() === '') {
        return { success: false, error: 'Titel ist erforderlich' }
    }

    const { data, error } = await supabase
        .from('feature_requests')
        .insert({
            title: title.trim(),
            description: description?.trim() || null,
            created_by: user.id,
            votes: 1 // Creator automatically votes for their own feature
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating feature request:', error)
        return { success: false, error: error.message }
    }

    // Add creator's vote to a votes tracking (we'll handle this with a simple increment for now)
    revalidatePath('/features')
    return { success: true, data }
}

export async function voteForFeature(featureId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Increment the votes count
    const { error } = await supabase.rpc('increment_feature_votes', { feature_id: featureId })

    if (error) {
        // Fallback: direct update if RPC doesn't exist
        const { error: updateError } = await supabase
            .from('feature_requests')
            .update({ votes: supabase.rpc('increment', { x: 1 }) })
            .eq('id', featureId)

        if (updateError) {
            console.error('Error voting:', updateError)
            return { success: false, error: updateError.message }
        }
    }

    revalidatePath('/features')
    return { success: true }
}

export async function getFeatureRequests() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('feature_requests')
        .select('*, profiles(full_name, email)')
        .order('votes', { ascending: false })

    if (error) {
        console.error('Error fetching features:', error)
        return []
    }

    return data
}
