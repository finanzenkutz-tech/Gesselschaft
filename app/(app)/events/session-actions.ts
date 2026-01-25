'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/(app)/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

export async function createGameSession(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const eventId = formData.get('event_id') as string
    const gameName = formData.get('game_name') as string
    const gameImageUrl = formData.get('game_image_url') as string

    const { data, error } = await supabase
        .from('game_sessions')
        .insert({
            event_id: eventId,
            game_name: gameName,
            game_image_url: gameImageUrl || null,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating game session:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true, data }
}

export async function addPlayerToSession(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const sessionId = formData.get('session_id') as string
    const playerId = formData.get('player_id') as string
    const score = formData.get('score') as string
    const placement = formData.get('placement') as string

    const { data, error } = await supabase
        .from('game_session_players')
        .insert({
            session_id: sessionId,
            user_id: playerId,
            score: score ? parseInt(score) : null,
            placement: placement ? parseInt(placement) : null
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding player:', error)
        return { success: false, error: error.message }
    }

    // Award points for participation
    await addXP(playerId, XP_REWARDS.game_played || 10)

    revalidatePath(`/events`)
    return { success: true, data }
}

export async function getEventSessions(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('game_sessions')
        .select('*, game_session_players(*, profiles(full_name, avatar_url))')
        .eq('event_id', eventId)
        .order('played_at', { ascending: false })

    if (error) {
        console.error('Error fetching sessions:', error)
        return []
    }

    return data
}

export async function getLeaderboard() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, points, badges')
        .order('points', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching leaderboard:', error)
        return []
    }

    // Map data to ensure display name fallback
    return data.map(entry => ({
        ...entry,
        full_name: entry.full_name || entry.email?.split('@')[0] || 'Spieler'
    }))
}

export async function addSessionReport(sessionId: string, report: {
    report_text: string
    winner_id: string | null
    report_image_url: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('game_sessions')
        .update({
            report_text: report.report_text,
            winner_id: report.winner_id,
            report_image_url: report.report_image_url
        })
        .eq('id', sessionId)

    if (error) {
        console.error('Error adding report:', error)
        return { success: false, error: error.message }
    }

    // Award bonus points to winner
    if (report.winner_id) {
        await addXP(report.winner_id, XP_REWARDS.game_won || 30, 'Du hast ein Spiel gewonnen!')
    }

    revalidatePath('/events')
    return { success: true }
}

