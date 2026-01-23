export type LevelInfo = {
    level: number
    rank: string
    color: string
    xpToNext: number
    progress: number
}

export type Badge = {
    id: string
    name: string
    description: string
    icon: string // Emoji or icon name
    color: string
    requirement: string
}

// All available badges in the system
export const BADGES: Record<string, Badge> = {
    // Participation badges
    first_event: {
        id: 'first_event',
        name: 'Erstes Event',
        description: 'Hat am ersten Event teilgenommen',
        icon: '🎲',
        color: 'bg-blue-100 text-blue-600',
        requirement: 'Nimm an deinem ersten Event teil'
    },
    regular: {
        id: 'regular',
        name: 'Stammgast',
        description: 'Hat an 10+ Events teilgenommen',
        icon: '⭐',
        color: 'bg-amber-100 text-amber-600',
        requirement: 'Nimm an 10 Events teil'
    },
    most_participated: {
        id: 'most_participated',
        name: 'Meist dabei',
        description: 'Top 3 mit den meisten Event-Teilnahmen',
        icon: '🏆',
        color: 'bg-yellow-100 text-yellow-600',
        requirement: 'Sei unter den Top 3 Teilnehmern'
    },

    // Reliability badges
    reliable: {
        id: 'reliable',
        name: 'Verlässlich',
        description: 'Sagt zu und erscheint immer',
        icon: '🤝',
        color: 'bg-green-100 text-green-600',
        requirement: 'Erscheine bei 5 Events ohne Absage'
    },
    super_reliable: {
        id: 'super_reliable',
        name: 'Super Verlässlich',
        description: 'Noch nie bei einem zugesagten Event gefehlt',
        icon: '💎',
        color: 'bg-purple-100 text-purple-600',
        requirement: 'Erscheine bei 20 Events ohne Absage'
    },

    // Punctuality badges
    punctual: {
        id: 'punctual',
        name: 'Pünktlich',
        description: 'Ist immer rechtzeitig da',
        icon: '⏰',
        color: 'bg-sky-100 text-sky-600',
        requirement: 'Sei bei 5 Events pünktlich'
    },
    always_on_time: {
        id: 'always_on_time',
        name: 'Immer pünktlich',
        description: 'Schafft es immer rechtzeitig',
        icon: '🎯',
        color: 'bg-indigo-100 text-indigo-600',
        requirement: 'Sei bei 15 Events pünktlich'
    },

    // Contribution badges
    game_bringer: {
        id: 'game_bringer',
        name: 'Spiele-Bringer',
        description: 'Bringt regelmäßig Spiele mit',
        icon: '📦',
        color: 'bg-orange-100 text-orange-600',
        requirement: 'Bringe zu 5 Events Spiele mit'
    },
    snack_hero: {
        id: 'snack_hero',
        name: 'Snack-Held',
        description: 'Versorgt die Gruppe mit Essen',
        icon: '🍕',
        color: 'bg-red-100 text-red-600',
        requirement: 'Bringe zu 5 Events Snacks mit'
    },
    driver: {
        id: 'driver',
        name: 'Fahrer',
        description: 'Bietet Mitfahrgelegenheiten an',
        icon: '🚗',
        color: 'bg-teal-100 text-teal-600',
        requirement: 'Biete 3 Fahrten an'
    },

    // Game performance badges
    winner: {
        id: 'winner',
        name: 'Gewinner',
        description: 'Hat das erste Spiel gewonnen',
        icon: '🥇',
        color: 'bg-yellow-100 text-yellow-700',
        requirement: 'Gewinne dein erstes Spiel'
    },
    champion: {
        id: 'champion',
        name: 'Champion',
        description: 'Hat 10+ Spiele gewonnen',
        icon: '👑',
        color: 'bg-amber-100 text-amber-700',
        requirement: 'Gewinne 10 Spiele'
    },

    // Social badges
    host: {
        id: 'host',
        name: 'Gastgeber',
        description: 'Hat ein Event bei sich veranstaltet',
        icon: '🏠',
        color: 'bg-pink-100 text-pink-600',
        requirement: 'Veranstalte ein Event bei dir'
    },
    social_butterfly: {
        id: 'social_butterfly',
        name: 'Netzwerker',
        description: 'Hat 5+ Buddies',
        icon: '🦋',
        color: 'bg-violet-100 text-violet-600',
        requirement: 'Füge 5 Buddies hinzu'
    },

    // Idea badges
    idea_starter: {
        id: 'Idea Starter',
        name: 'Ideen-Starter',
        description: 'Hat die erste Idee eingereicht',
        icon: '💡',
        color: 'bg-blue-100 text-blue-600',
        requirement: 'Reiche deine erste Idee ein'
    },
    idea_machine: {
        id: 'Idea Machine',
        name: 'Ideen-Maschine',
        description: 'Hat 3 Ideen eingereicht',
        icon: '⚡',
        color: 'bg-amber-100 text-amber-600',
        requirement: 'Reiche 3 Ideen ein'
    },
    innovator: {
        id: 'Innovator',
        name: 'Innovator',
        description: 'Hat 10 Ideen eingereicht',
        icon: '🚀',
        color: 'bg-purple-100 text-purple-600',
        requirement: 'Reiche 10 Ideen ein'
    },
}

const ranks = [
    { minLevel: 0, name: 'Tisch-Gast', color: 'text-slate-400' },
    { minLevel: 5, name: 'Würfel-Lehrling', color: 'text-blue-500' },
    { minLevel: 10, name: 'Brett-Kenner', color: 'text-green-500' },
    { minLevel: 20, name: 'Strategie-Meister', color: 'text-purple-500' },
    { minLevel: 50, name: 'Spiele-Legende', color: 'text-amber-500' },
    { minLevel: 100, name: 'Ewiger Spielleiter', color: 'text-red-500' },
]

export function getLevelInfo(points: number = 0): LevelInfo {
    // Basic formula: Level = floor(sqrt(points / 10))
    const level = Math.floor(Math.sqrt(points / 10)) || 1
    const currentLevelXP = Math.pow(level, 2) * 10
    const nextLevelXP = Math.pow(level + 1, 2) * 10

    const xpInLevel = points - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP
    const progress = Math.min(Math.max((xpInLevel / xpNeededForLevel) * 100, 0), 100)

    const rank = ranks.slice().reverse().find(r => level >= r.minLevel) || ranks[0]

    return {
        level,
        rank: rank.name,
        color: rank.color,
        xpToNext: nextLevelXP - points,
        progress
    }
}

// Get badge info by ID
export function getBadge(badgeId: string): Badge | undefined {
    return BADGES[badgeId]
}

// Get all badges for a user
export function getUserBadges(badgeIds: string[]): Badge[] {
    return badgeIds.map(id => BADGES[id]).filter(Boolean)
}

// XP rewards for actions
export const XP_REWARDS = {
    event_attended: 50,
    event_created: 100,
    game_won: 30,
    game_played: 10,
    contribution_made: 20,
    carpool_offered: 40,
    first_event: 100,
    invite_accepted: 25,
}

