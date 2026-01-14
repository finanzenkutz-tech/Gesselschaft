'use client'

import { BADGES, Badge, getUserBadges } from '@/lib/utils/gamification'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

type BadgeDisplayProps = {
    badgeIds: string[]
    size?: 'sm' | 'md' | 'lg'
    showAll?: boolean
    maxVisible?: number
}

export function BadgeDisplay({ badgeIds, size = 'md', showAll = false, maxVisible = 5 }: BadgeDisplayProps) {
    const badges = getUserBadges(badgeIds)
    const visibleBadges = showAll ? badges : badges.slice(0, maxVisible)
    const hiddenCount = badges.length - visibleBadges.length

    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    }

    if (badges.length === 0) {
        return (
            <p className="text-slate-400 text-sm italic">Noch keine Abzeichen</p>
        )
    }

    return (
        <TooltipProvider>
            <div className="flex flex-wrap gap-1.5">
                {visibleBadges.map((badge) => (
                    <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm border",
                                    badge.color,
                                    sizeClasses[size]
                                )}
                            >
                                <span>{badge.icon}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                            <p className="font-bold">{badge.name}</p>
                            <p className="text-xs text-slate-500">{badge.description}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                {hiddenCount > 0 && (
                    <div
                        className={cn(
                            "rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 font-bold",
                            sizeClasses[size]
                        )}
                    >
                        +{hiddenCount}
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}

// Show all available badges with progress
export function BadgeGrid({ earnedBadges }: { earnedBadges: string[] }) {
    const allBadges = Object.values(BADGES)

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allBadges.map((badge) => {
                const isEarned = earnedBadges.includes(badge.id)
                return (
                    <div
                        key={badge.id}
                        className={cn(
                            "p-4 rounded-2xl border-2 transition-all",
                            isEarned
                                ? "bg-white border-primary/20 shadow-lg"
                                : "bg-slate-50 border-slate-100 opacity-50 grayscale"
                        )}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm",
                                    isEarned ? badge.color : "bg-slate-200 text-slate-400"
                                )}
                            >
                                {badge.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "font-bold text-sm truncate",
                                    isEarned ? "text-slate-800" : "text-slate-400"
                                )}>
                                    {badge.name}
                                </p>
                                {isEarned && (
                                    <span className="text-[10px] font-bold text-green-500 uppercase">Freigeschaltet</span>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                            {isEarned ? badge.description : badge.requirement}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
