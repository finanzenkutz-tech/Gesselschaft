'use client'

import { useState } from 'react'
import { UserX, Volume2, Loader2, VolumeX } from 'lucide-react'
import { muteUser, unmuteUser } from '@/app/(app)/settings/user-settings-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MuteUserButtonProps {
    targetUserId: string
    targetUserName: string
    initialIsMuted: boolean
    className?: string
}

export function MuteUserButton({ targetUserId, targetUserName, initialIsMuted, className }: MuteUserButtonProps) {
    const [isMuted, setIsMuted] = useState(initialIsMuted)
    const [loading, setLoading] = useState(false)

    const handleMute = async () => {
        setLoading(true)
        try {
            if (isMuted) {
                await unmuteUser(targetUserId)
                setIsMuted(false)
                toast.success(`${targetUserName} wieder laut geschaltet`)
            } else {
                await muteUser(targetUserId)
                setIsMuted(true)
                toast.success(`${targetUserName} stummgeschaltet`)
            }
        } catch (err) {
            toast.error("Aktion fehlgeschlagen")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleMute}
            disabled={loading}
            className={cn(
                "p-2 rounded-xl transition-all hover:scale-110 active:scale-95",
                isMuted
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "text-slate-300 hover:text-slate-600 hover:bg-slate-100",
                className
            )}
            title={isMuted ? "Stummschaltung aufheben" : `${targetUserName} stummschalten`}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
    )
}

