'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, LogOut, Loader2 } from 'lucide-react'
import { checkIn, checkOut } from '@/app/events/check-in-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CheckInButtonProps {
    eventId: string
    checkedInAt?: string | null
    checkedOutAt?: string | null
    isGoing: boolean
}

export function CheckInButton({ eventId, checkedInAt, checkedOutAt, isGoing }: CheckInButtonProps) {
    const [loading, setLoading] = useState(false)

    if (!isGoing) return null

    const handleCheckIn = async () => {
        setLoading(true)
        try {
            await checkIn(eventId)
            toast.success("Eingecheckt! Viel Spaß!")
        } catch (err) {
            toast.error("Check-in fehlgeschlagen")
        } finally {
            setLoading(false)
        }
    }

    const handleCheckOut = async () => {
        setLoading(true)
        try {
            await checkOut(eventId)
            toast.success("Ausgecheckt! Bis zum nächsten Mal!")
        } catch (err) {
            toast.error("Check-out fehlgeschlagen")
        } finally {
            setLoading(false)
        }
    }

    if (checkedOutAt) {
        return (
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Event abgeschlossen
            </div>
        )
    }

    if (checkedInAt) {
        return (
            <Button
                onClick={handleCheckOut}
                disabled={loading}
                variant="outline"
                className="rounded-xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold px-6 shadow-sm transition-all h-11"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                Jetzt Auschecken
            </Button>
        )
    }

    return (
        <Button
            onClick={handleCheckIn}
            disabled={loading}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 shadow-lg shadow-emerald-200 transition-all h-11 animate-pulse-subtle"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Ich bin jetzt da! (Check-In)
        </Button>
    )
}
