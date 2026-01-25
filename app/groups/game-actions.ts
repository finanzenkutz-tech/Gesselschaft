'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addXP } from '@/app/gamification/actions'
import { XP_REWARDS } from '@/lib/utils/gamification'

export async function getGroupGames(groupId: string) {
    const supabase = await createClient()

    // Fetch members of the group
    const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

    const userIds = members?.map(m => m.user_id) || []

    // Build query to fetch items either:
    // 1. Owned by the group (group_id = groupId)
    // 2. Owned by members (owner_id in userIds) AND not private
    let query = supabase
        .from('inventory')
        .select('*, profiles:owner_id(full_name, avatar_url)')
        .order('name', { ascending: true })

    if (userIds.length > 0) {
        // Construct the OR filter safely
        // Note: For large lists of userIds this string concat might be risky but for typical groups < 100 it's fine.
        // Format: group_id.eq.ID,and(owner_id.in.("id1","id2"),visibility.neq.private)
        const userIdsString = userIds.map(id => `"${id}"`).join(',')
        query = query.or(`group_id.eq.${groupId},and(owner_id.in.(${userIdsString}),visibility.neq.private)`)
    } else {
        query = query.eq('group_id', groupId)
    }

    const { data: games, error } = await query

    if (error) {
        console.error('Error fetching group games:', error)
        return []
    }

    return games
}

export async function getGroupRecentGames(groupId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_group_recent_games', { p_group_id: groupId })

    if (error) {
        console.error('Error fetching recent group games:', error)
        return []
    }


    return data
}

export async function logGameSession(data: {
    groupId: string,
    gameName: string,
    gameImageUrl?: string,
    playedAt: string,
    playerIds: string[],
    winnerId?: string,
    scores?: Record<string, number>,
    location?: string,
    comment?: string,
    // New fields
    placements?: Record<string, number>,
    punctuality?: Record<string, boolean>,
    brings?: Record<string, string>,
    // Rating fields
    rating?: number,
    complexityRating?: number,
    durationRating?: number,
    durationActual?: number,
    mood?: string,
    // New features
    isEpic?: boolean,
    reportImageUrl?: string,
    eventId?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // 1. Create Session
    const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
            group_id: data.groupId,
            game_name: data.gameName,
            game_image_url: data.gameImageUrl,
            played_at: data.playedAt,
            created_by: user.id,
            winner_id: data.winnerId || null,
            report_text: data.comment || null,
            event_id: data.eventId || null,
            location: data.location || null,
            duration_minutes: data.durationActual || null,
            mood: data.mood || null,
            is_epic: data.isEpic || false,
            report_image_url: data.reportImageUrl || null
        })
        .select()
        .single()

    if (sessionError) {
        console.error('Error creating session:', sessionError)
        throw new Error('Fehler beim Erstellen der Session: ' + sessionError.message)
    }

    // 2. Add Players
    if (data.playerIds.length > 0) {
        const playersData = data.playerIds.map(uid => ({
            session_id: session.id,
            user_id: uid,
            score: data.scores?.[uid] !== undefined ? data.scores[uid] : null,
            placement: data.placements?.[uid] || null,
            is_punctual: data.punctuality?.[uid] !== undefined ? data.punctuality[uid] : true, // Default true
            brings: data.brings?.[uid] || null
        }))

        const { error: playersError } = await supabase
            .from('game_session_players')
            .insert(playersData)

        if (playersError) {
            console.error('Error adding players:', playersError)
        }
    }

    // 3. Create/Update Review if rating info provided
    if (data.rating || data.complexityRating || data.durationRating || data.comment) {
        const { error: reviewError } = await supabase
            .from('game_reviews')
            .upsert({
                group_id: data.groupId,
                game_name: data.gameName,
                user_id: user.id,
                rating: data.rating || null,
                complexity_rating: data.complexityRating || null,
                duration_minutes: data.durationRating, // We use the rating 1-5 for duration (categorical)
                comment: data.comment || null
            }, {
                onConflict: 'group_id, game_name, user_id'
            })

        if (reviewError) {
            console.error('Error upserting review:', reviewError)
        }
    }

    // 4. Award XP (Gamification)
    try {
        // Creator gets 20 XP for logging (Service)
        await addXP(user.id, XP_REWARDS.contribution_made || 20, `Spiel "${data.gameName}" geloggt!`)

        // All players get 10 XP for playing
        for (const pid of data.playerIds) {
            // Avoid double awarding creator if they are in playerIds (which they usually are)
            // But usually "logging" is separate from "playing". Let's give them playing XP too.
            await addXP(pid, XP_REWARDS.game_played || 10, `Gespielt: "${data.gameName}"`)
        }

        // Winner gets additional 30 XP
        if (data.winnerId) {
            await addXP(data.winnerId, XP_REWARDS.game_won || 30, `Gewonnen: "${data.gameName}"!`)
        }

        // Additional XP for placements
        if (data.placements) {
            for (const [uid, rank] of Object.entries(data.placements)) {
                // Winner is already handled (usually rank 1)
                // Ensure we don't double dip if winnerId is also rank 1 (which acts normally)
                if (uid !== data.winnerId) {
                    if (rank === 1) await addXP(uid, XP_REWARDS.game_won || 30, `Gewonnen: "${data.gameName}"!`) // Fallback if winnerId missing
                    if (rank === 2) await addXP(uid, 15, `2. Platz: "${data.gameName}"`)
                    if (rank === 3) await addXP(uid, 10, `3. Platz: "${data.gameName}"`)
                }
            }
        }
    } catch (xpError) {
        console.error('Error awarding XP:', xpError)
    }

    revalidatePath(`/groups/${data.groupId}`)
    revalidatePath('/profile')
    return session
}

export async function updateGameSession(sessionId: string, data: {
    gameName: string,
    gameImageUrl?: string,
    playedAt: string,
    winnerId?: string,
    location?: string,
    comment?: string,
    playerIds: string[],
    scores?: Record<string, number>,
    brings?: Record<string, string>,
    punctuality?: Record<string, boolean>,
    isEpic?: boolean,
    reportImageUrl?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // 1. Update Session Details
    const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({
            game_name: data.gameName,
            game_image_url: data.gameImageUrl,
            played_at: data.playedAt,
            winner_id: data.winnerId || null,
            report_text: data.comment || null,
            location: data.location || null,
            is_epic: data.isEpic || false,
            report_image_url: data.reportImageUrl || null
        })
        .eq('id', sessionId)

    if (sessionError) {
        console.error('Error updating session:', sessionError)
        throw new Error('Fehler beim Aktualisieren der Session')
    }

    // 2. Update Players (Delete all and re-insert is simplified for now)
    // Delete existing
    const { error: deleteError } = await supabase.from('game_session_players').delete().eq('session_id', sessionId)
    if (deleteError) {
        console.error('Error deleting players before update:', deleteError)
        throw new Error('Fehler beim Entfernen der alten Spielerdaten: ' + deleteError.message)
    }

    // Insert new
    if (data.playerIds.length > 0) {
        const playersData = data.playerIds.map(uid => ({
            session_id: sessionId,
            user_id: uid,
            score: data.scores?.[uid] !== undefined ? data.scores[uid] : null,
            is_punctual: data.punctuality?.[uid] !== undefined ? data.punctuality[uid] : true,
            brings: data.brings?.[uid] || null
        }))

        const { error: playersError } = await supabase
            .from('game_session_players')
            .insert(playersData)

        if (playersError) {
            console.error('Error updating players:', playersError)
            throw new Error('Fehler beim Speichern der neuen Spielerdaten: ' + playersError.message)
        }
    }

    return { success: true }
}

export async function deleteGameSession(sessionId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', sessionId)

    if (error) {
        throw new Error('Fehler beim Löschen')
    }
    return { success: true }
}

export async function getGroupLeaderboard(groupId: string) {
    const supabase = await createClient()

    // Fetch all sessions in this group
    const { data: sessions, error } = await supabase
        .from('game_sessions')
        .select(`
            winner_id,
            game_session_players(
                user_id,
                score
            )
        `)
        .eq('group_id', groupId)

    if (error) {
        console.error('Error fetching leaderboard data:', error)
        return []
    }

    const stats: Record<string, { wins: number, totalScore: number, gamesPlayed: number }> = {}

    sessions.forEach(session => {
        // Count win
        if (session.winner_id) {
            if (!stats[session.winner_id]) stats[session.winner_id] = { wins: 0, totalScore: 0, gamesPlayed: 0 }
            stats[session.winner_id].wins++
        }

        // Count scores and games played
        session.game_session_players.forEach((player: any) => {
            if (!stats[player.user_id]) stats[player.user_id] = { wins: 0, totalScore: 0, gamesPlayed: 0 }
            stats[player.user_id].gamesPlayed++
            if (player.score) {
                stats[player.user_id].totalScore += player.score
            }
        })
    })

    // Fetch profile info for these users
    const userIds = Object.keys(stats)
    if (userIds.length === 0) return []

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

    const leaderboard = profiles?.map(profile => ({
        ...profile,
        ...stats[profile.id]
    })) || []

    return leaderboard.sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed)
}
export async function getMemberComparison(groupId: string, targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Fetch Shared Sessions
    // A shared session is a session where BOTH users participated
    const { data: sessions, error: sessionsError } = await supabase
        .from('game_session_players')
        .select(`
            session_id,
            game_sessions!inner(
                id,
                game_name,
                game_image_url,
                played_at,
                winner_id,
                group_id
            )
        `)
        .eq('user_id', user.id)
        .eq('game_sessions.group_id', groupId)

    const mySessionIds = sessions?.map(s => s.session_id) || []

    // Now find sessions from target user that are in mySessionIds
    const { data: sharedPlayers, error: sharedError } = await supabase
        .from('game_session_players')
        .select(`
            session_id,
            score,
            game_sessions!inner(
                id,
                game_name,
                game_image_url,
                played_at,
                winner_id
            )
        `)
        .eq('user_id', targetUserId)
        .in('session_id', mySessionIds)

    // 2. Head-to-Head Stats
    let myWins = 0
    let targetWins = 0
    const commonSessions = sharedPlayers?.map(sp => {
        const session = Array.isArray(sp.game_sessions) ? sp.game_sessions[0] : sp.game_sessions
        const isMyWin = session.winner_id === user.id
        const isTargetWin = session.winner_id === targetUserId
        if (isMyWin) myWins++
        if (isTargetWin) targetWins++
        return session
    }) || []

    // 3. Shared Games in Inventory
    const { data: myInventory } = await supabase.from('inventory').select('name').eq('owner_id', user.id)
    const { data: targetInventory } = await supabase.from('inventory').select('name').eq('owner_id', targetUserId)

    const myGameNames = new Set(myInventory?.map(i => i.name.toLowerCase()))
    const sharedInventory = targetInventory?.filter(i => myGameNames.has(i.name.toLowerCase())) || []

    return {
        sharedSessions: commonSessions,
        stats: {
            myWins,
            targetWins,
            totalShared: commonSessions.length,
            isNemesis: (myWins >= targetWins + 2) || (targetWins >= myWins + 2),
            isDreamTeam: commonSessions.length >= 5
        },
        sharedInventory: sharedInventory.map(i => i.name)
    }
}

export async function voteReviewHelpful(reviewId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Check if vote already exists
    const { data: existing } = await supabase
        .from('game_review_votes')
        .select()
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        // Remove vote
        await supabase
            .from('game_review_votes')
            .delete()
            .eq('id', existing.id)
        return { action: 'removed' }
    } else {
        // Add vote
        await supabase
            .from('game_review_votes')
            .insert({
                review_id: reviewId,
                user_id: user.id
            })
        return { action: 'added' }
    }
}

export async function getGameSessionDetails(sessionId: string) {
    const supabase = await createClient()

    const { data: session, error } = await supabase
        .from('game_sessions')
        .select(`
            *,
            game_session_players(
                score,
                placement,
                is_punctual,
                brings,
                profiles(id, full_name, avatar_url)
            ),
            profiles:created_by(full_name)
        `)
        .eq('id', sessionId)
        .single()

    if (error) {
        console.error('Error fetching session details:', error)
        return null
    }

    return session
}

export async function uploadSessionImage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Keine Datei' }

    const fileExt = file.name.split('.').pop()
    const fileName = `sessions/${user.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('game-images')
        .upload(fileName, file)

    if (uploadError) {
        console.error('Error uploading image:', uploadError)
        return { success: false, error: uploadError.message }
    }

    const { data: publicUrl } = supabase.storage
        .from('game-images')
        .getPublicUrl(fileName)

    return { success: true, url: publicUrl.publicUrl }
}
