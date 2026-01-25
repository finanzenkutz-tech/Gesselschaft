'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

export async function createChallenge(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const challengedId = formData.get('challenged_id') as string
    const gameSuggestion = formData.get('game_suggestion') as string

    if (!challengedId) {
        return { success: false, error: 'Kein Gegner ausgewählt' }
    }

    const { data, error } = await supabase
        .from('challenges')
        .insert({
            challenger_id: user.id,
            challenged_id: challengedId,
            game_suggestion: gameSuggestion || null,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating challenge:', error)
        return { success: false, error: error.message }
    }

    // Notify the challenged user
    const { createNotification } = await import('@/app/notifications/actions')
    await createNotification(
        challengedId,
        'challenge',
        'Neue Herausforderung!',
        `Ein Spieler hat dich herausgefordert!`,
        '/challenge'
    )

    revalidatePath('/challenges')
    return { success: true, data }
}

export async function respondToChallenge(challengeId: string, accept: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('challenges')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', challengeId)
        .eq('challenged_id', user.id)

    if (error) {
        console.error('Error responding to challenge:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/challenges')
    return { success: true }
}

export async function completeChallenge(challengeId: string, winnerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('challenges')
        .update({
            status: 'completed',
            winner_id: winnerId
        })
        .eq('id', challengeId)

    if (error) {
        console.error('Error completing challenge:', error)
        return { success: false, error: error.message }
    }

    // Award points to winner
    // Award points to winner
    await addXP(winnerId, XP_REWARDS.game_won || 30, 'Du hast eine Challenge gewonnen!')

    revalidatePath('/challenges')
    return { success: true }
}

export async function getMyChallenges() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('challenges')
        .select('*, challenger:profiles!challenger_id(*), challenged:profiles!challenged_id(*)')
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

    return data || []
}
