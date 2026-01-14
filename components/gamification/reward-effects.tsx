'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { getLevelInfo } from '@/lib/utils/gamification'

interface RewardEffectsProps {
    points?: number
    badges?: string[]
}

export function RewardEffects({ points = 0, badges = [] }: RewardEffectsProps) {
    const prevPoints = useRef(points)
    const prevBadgesLength = useRef(badges.length)
    const isInitialMount = useRef(true)

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        // 1. Check for Level Up
        const oldLevel = getLevelInfo(prevPoints.current).level
        const newLevel = getLevelInfo(points).level

        if (newLevel > oldLevel) {
            triggerLevelUpConfetti(newLevel)
        }

        // 2. Check for New Badge
        if (badges.length > prevBadgesLength.current) {
            triggerBadgeConfetti()
        }

        // Update refs
        prevPoints.current = points
        prevBadgesLength.current = badges.length
    }, [points, badges])

    const triggerLevelUpConfetti = (level: number) => {
        toast.success(`LEVEL UP! 🎉`, {
            description: `Du bist jetzt Level ${level}!`,
            duration: 5000,
        })

        const duration = 5 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)
    }

    const triggerBadgeConfetti = () => {
        toast.success(`NEUES BADGE VERDIENT! 🏅`, {
            description: 'Schau in dein Profil, um deine neue Auszeichnung zu sehen.',
            duration: 5000,
        })

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 9999
        })
    }

    return null // This component only handles side effects
}
