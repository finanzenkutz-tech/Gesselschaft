'use server'

import { createClient } from '@/lib/supabase/server'

export interface PunctualityStat {
    user_id: string
    full_name: string | null
    avatar_url: string | null
    total_events: number
    attended_events: number
    on_time_events: number
    reliability_score: number // % showed up
    punctuality_score: number // % on time (of those attended)
    overall_score: number // Weighted average
}

export async function getPunctualityStats(): Promise<PunctualityStat[]> {
    const supabase = await createClient()

    // Get all past events and their attendees
    const now = new Date().toISOString()
    const { data: attendees, error } = await supabase
        .from('event_attendees')
        .select(`
            user_id,
            status,
            checked_in_at,
            events (
                start_time
            ),
            profiles (
                full_name,
                avatar_url
            )
        `)
        .eq('status', 'going')
        .lt('events.start_time', now) // Only past events
        .order('events(start_time)', { ascending: false })

    if (error) {
        console.error('Error fetching punctuality stats:', error)
        return []
    }

    if (!attendees) return []

    // Group by user
    const userStats = new Map<string, {
        user_id: string
        full_name: string | null
        avatar_url: string | null
        total_events: number
        attended_events: number
        on_time_events: number
    }>()

    attendees.forEach((record: any) => {
        // Skip if event details are missing (e.g. deleted event)
        if (!record.events) return

        const userId = record.user_id
        if (!userStats.has(userId)) {
            userStats.set(userId, {
                user_id: userId,
                full_name: record.profiles?.full_name || 'Unbekannt',
                avatar_url: record.profiles?.avatar_url,
                total_events: 0,
                attended_events: 0,
                on_time_events: 0
            })
        }

        const stats = userStats.get(userId)!
        stats.total_events++

        if (record.checked_in_at) {
            stats.attended_events++

            const checkInTime = new Date(record.checked_in_at).getTime()
            const startTime = new Date(record.events.start_time).getTime()
            // 15 minutes grace period
            const gracePeriod = 15 * 60 * 1000

            if (checkInTime <= startTime + gracePeriod) {
                stats.on_time_events++
            }
        }
    })

    // Calculate scores
    const results: PunctualityStat[] = Array.from(userStats.values())
        .map(stat => {
            const reliability = (stat.attended_events / stat.total_events) * 100
            const punctuality = stat.attended_events > 0
                ? (stat.on_time_events / stat.attended_events) * 100
                : 0

            // Overall score: 60% reliability, 40% punctuality
            // But if reliability is low, overall should be low.
            const overall = (reliability * 0.7) + (punctuality * 0.3)

            return {
                ...stat,
                reliability_score: Math.round(reliability),
                punctuality_score: Math.round(punctuality),
                overall_score: Math.round(overall)
            }
        })
        .filter(s => s.total_events >= 3) // Only show users with at least 3 events to avoid skew
        .sort((a, b) => b.overall_score - a.overall_score)

    return results
}
