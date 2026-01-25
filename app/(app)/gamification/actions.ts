'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Award a badge to a user
 */
export async function awardBadge(userId: string, badgeName: string, eventId?: string) {
    const supabase = await createClient()

    // Get badge definition
    const { data: badge } = await supabase
        .from('badge_definitions')
        .select('id, points_value')
        .eq('name', badgeName)
        .single()

    if (!badge) {
        console.error('Badge not found:', badgeName)
        return { success: false, error: 'Badge nicht gefunden' }
    }

    // Check if already awarded (for this event if applicable)
    const query = supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)

    if (eventId) {
        query.eq('event_id', eventId)
    }

    const { data: existing } = await query.single()

    if (existing) {
        return { success: false, error: 'Badge bereits vergeben' }
    }

    // Award badge
    const { error } = await supabase
        .from('user_badges')
        .insert({
            user_id: userId,
            badge_id: badge.id,
            event_id: eventId || null
        })

    if (error) {
        console.error('Error awarding badge:', error)
        return { success: false, error: error.message }
    }

    // Award points
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('points, badges')
        .eq('id', userId)
        .single()

    if (currentProfile) {
        const currentBadges = currentProfile.badges || []
        await supabase
            .from('profiles')
            .update({
                points: (currentProfile.points || 0) + (badge.points_value || 0),
                badges: [...currentBadges, badgeName]
            })
            .eq('id', userId)
    }

    // Create notification
    await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type: 'badge_earned',
            title: `Neues Badge: ${badgeName}! 🏆`,
            message: `Du hast das "${badgeName}" Badge erhalten!`,
            link: '/level'
        })

    revalidatePath('/level')
    return { success: true }
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge_definitions(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

    if (error) {
        console.error('Error fetching badges:', error)
        return []
    }

    return data || []
}

/**
 * Nominate someone for Erklär-Bär badge
 */
export async function nominateExplainer(nomineeId: string, eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Can't nominate yourself
    if (nomineeId === user.id) {
        return { success: false, error: 'Du kannst dich nicht selbst nominieren' }
    }

    // Check if user has explained 3+ times (simplified: just award directly for now)
    await awardBadge(nomineeId, 'Erklär-Bär', eventId)

    return { success: true }
}

/**
 * Check and award punctuality badge
 */
export async function checkPunctuality(userId: string, eventId: string, eventStartTime: string) {
    const supabase = await createClient()

    const eventStart = new Date(eventStartTime)
    const now = new Date()

    // If checked in within 15 minutes of start time
    const timeDiff = (now.getTime() - eventStart.getTime()) / (1000 * 60)
    const isPunctual = timeDiff >= -30 && timeDiff <= 15 // 30 min early to 15 min late

    // Update attendee record
    await supabase
        .from('event_attendees')
        .update({
            checked_in_at: now.toISOString(),
            was_punctual: isPunctual
        })
        .eq('event_id', eventId)
        .eq('user_id', userId)

    // Count punctual attendances
    const { count } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('was_punctual', true)

    // Award badge if 5+ punctual attendances
    if (count && count >= 5) {
        await awardBadge(userId, 'Pünktlichkeits-König')
    }

    return { success: true, isPunctual }
}
/**
 * Add XP to a user profile
 */
export async function addXP(userId: string, amount: number, reason?: string) {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single()

    if (profile) {
        const newPoints = (profile.points || 0) + amount
        await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', userId)

        // Optional: Create notification for XP gain if amount is significant
        if (amount >= 50 && reason) {
            await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'xp_gained',
                    title: `+${amount} XP verdient! ✨`,
                    message: reason,
                    link: '/level'
                })
        }
    }

    revalidatePath('/level')
    revalidatePath('/profile')
    return { success: true }
}
