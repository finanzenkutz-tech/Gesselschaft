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

    // GAMIFICATION: Award XP and Badges
    const { addXP, awardBadge } = await import('@/app/(app)/gamification/actions')

    // Award XP
    await addXP(user.id, 50, 'Idee eingereicht')

    // Check count of feature requests
    const { count } = await supabase
        .from('feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

    const ideaBadges = []

    if (count) {
        if (count >= 1) {
            const result = await awardBadge(user.id, 'Idea Starter')
            if (result.success) ideaBadges.push('Idea Starter')
        }
        if (count >= 3) {
            const result = await awardBadge(user.id, 'Idea Machine')
            if (result.success) ideaBadges.push('Idea Machine')
        }
        if (count >= 10) {
            const result = await awardBadge(user.id, 'Innovator')
            if (result.success) ideaBadges.push('Innovator')
        }
    }

    return {
        success: true,
        data,
        gamification: {
            xpEarned: 50,
            badgesEarned: ideaBadges,
            ideasCount: count || 1
        }
    }
}

export async function voteForFeature(featureId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Increment the votes count
    const { error } = await supabase.rpc('increment_feature_votes', { feature_id: featureId })

    if (error) {
        // Fallback: direct update (not atomic but functional)
        const { data: current } = await supabase
            .from('feature_requests')
            .select('votes')
            .eq('id', featureId)
            .single()

        const { error: updateError } = await supabase
            .from('feature_requests')
            .update({ votes: (current?.votes || 0) + 1 })
            .eq('id', featureId)

        if (updateError) {
            console.error('Error voting:', updateError)
            return { success: false, error: updateError.message }
        }
    }

    revalidatePath('/features')
    return { success: true }
}

export async function markFeatureAsCompleted(featureId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', user.id).single()
    if (profile?.system_role !== 'super_admin') {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const { error } = await supabase
        .from('feature_requests')
        .update({ status: 'completed', implemented_at: new Date().toISOString() })
        .eq('id', featureId)

    if (error) {
        console.error('Error marking feature as completed:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/features')
    return { success: true }
}

export async function deleteFeatureRequest(featureId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', user.id).single()
    if (profile?.system_role !== 'super_admin') {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const { error } = await supabase
        .from('feature_requests')
        .delete()
        .eq('id', featureId)

    if (error) {
        console.error('Error deleting feature request:', error)
        return { success: false, error: error.message }
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

