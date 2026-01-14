export type LevelInfo = {
    level: number
    rank: string
    color: string
    xpToNext: number
    progress: number
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
