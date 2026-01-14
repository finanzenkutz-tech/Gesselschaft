'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, HelpCircle, X, Users } from 'lucide-react'
import { upsertRSVP } from '@/app/events/rsvp-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RSVPButtonsProps {
    eventId: string
    currentStatus?: string
    currentGuestCount?: number
}

export function RSVPButtons({ eventId, currentStatus, currentGuestCount = 0 }: RSVPButtonsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [guestCount, setGuestCount] = useState(currentGuestCount)

    const handleRSVP = async (status: string) => {
        setIsLoading(true)
        await upsertRSVP(eventId, status, guestCount)
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col justify-center gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <p className="text-center text-slate-500 font-bold text-sm mb-2">Bist du dabei?</p>

            <div className="flex items-center gap-2 mb-2 px-2">
                <Users className="w-4 h-4 text-slate-400" />
                <Label htmlFor="guestCount" className="text-xs font-bold text-slate-500 uppercase">Gäste (+)</Label>
                <Input
                    type="number"
                    id="guestCount"
                    min="0"
                    max="5"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                    className="h-8 w-16 text-center text-sm ml-auto bg-white"
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Button
                    onClick={() => handleRSVP('going')}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-xl font-bold flex flex-col gap-1 ${currentStatus === 'going' ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-green-200 hover:text-green-500'}`}
                >
                    <Check className="w-5 h-5" />
                    <span className="text-[10px]">Dabei</span>
                </Button>

                <Button
                    onClick={() => handleRSVP('maybe')}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-xl font-bold flex flex-col gap-1 ${currentStatus === 'maybe' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-yellow-200 hover:text-yellow-500'}`}
                >
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-[10px]">Vielleicht</span>
                </Button>

                <Button
                    onClick={() => handleRSVP('not_going')}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-xl font-bold flex flex-col gap-1 ${currentStatus === 'not_going' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-red-200 hover:text-red-500'}`}
                >
                    <X className="w-5 h-5" />
                    <span className="text-[10px]">Nein</span>
                </Button>
            </div>
        </div>
    )
}
