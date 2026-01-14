'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleFavorite } from '@/app/marketplace/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner' // Assuming sonner is used, or alert/console

interface FavoriteButtonProps {
    listingId: string
    initialIsFavorite: boolean
    className?: string
    size?: 'sm' | 'default' | 'icon'
}

export function FavoriteButton({ listingId, initialIsFavorite, className, size = 'icon' }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation if inside a link
        e.stopPropagation()

        if (isLoading) return

        // Optimistic update
        setIsFavorite(!isFavorite)
        setIsLoading(true)

        try {
            const res = await toggleFavorite(listingId)
            if (!res.success) {
                setIsFavorite(!isFavorite) // Revert
                // toast.error('Fehler beim Speichern')
            }
        } catch (error) {
            setIsFavorite(!isFavorite) // Revert
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size={size}
            className={cn("hover:bg-transparent p-2 h-auto", className)}
            onClick={handleToggle}
            disabled={isLoading}
        >
            <Heart
                className={cn(
                    "transition-all duration-300",
                    isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-slate-500 hover:text-red-500 hover:scale-110"
                )}
                size={size === 'sm' ? 18 : 24}
                strokeWidth={isFavorite ? 0 : 2}
            />
        </Button>
    )
}
