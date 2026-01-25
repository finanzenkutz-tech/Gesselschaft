'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { de } from 'date-fns/locale'

export async function getPersonalStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const sixMonthsAgo = subMonths(new Date(), 5).toISOString() // 5 + current = 6

    const { data, error } = await supabase
        .from('game_session_players')
        .select(`
            game_sessions!inner (
                played_at
            )
        `)
        .eq('user_id', user.id)
        .gte('game_sessions.played_at', sixMonthsAgo)

    if (error || !data) return []

    // Aggregate by month
    const statsMap: Record<string, number> = {}

    // Init last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        const key = format(d, 'MMM', { locale: de })
        statsMap[key] = 0
    }

    data.forEach((item: any) => {
        const date = new Date(item.game_sessions.played_at)
        const key = format(date, 'MMM', { locale: de })
        if (statsMap[key] !== undefined) {
            statsMap[key]++
        }
    })

    return Object.entries(statsMap).map(([month, count]) => ({ month, value: count }))
}

export async function getGameOfTheMonth() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // 1. Get user's groups
    const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

    if (!userGroups || userGroups.length === 0) return null

    const groupIds = userGroups.map(g => g.group_id)

    // 2. Get sessions for these groups in current month
    const now = new Date()
    const start = startOfMonth(now).toISOString()
    const end = endOfMonth(now).toISOString()

    const { data: sessions, error } = await supabase
        .from('game_sessions')
        .select('game_name, game_image_url')
        .in('group_id', groupIds)
        .gte('played_at', start)
        .lte('played_at', end)

    if (error || !sessions || sessions.length === 0) return null

    // 3. Aggregate
    const counts: Record<string, { count: number, image: string, name: string }> = {}

    sessions.forEach(session => {
        const name = session.game_name
        if (!counts[name]) {
            counts[name] = { count: 0, image: session.game_image_url || '', name }
        }
        counts[name].count++
        if (!counts[name].image && session.game_image_url) {
            counts[name].image = session.game_image_url
        }
    })

    // 4. Find max
    let max = 0
    let winner = null

    Object.values(counts).forEach(item => {
        if (item.count > max) {
            max = item.count
            winner = item
        }
    })

    return winner
}
