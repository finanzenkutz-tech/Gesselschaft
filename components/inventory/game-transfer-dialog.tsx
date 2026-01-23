'use client'

import { useState, useEffect } from 'react'
import { ArrowRightLeft, Users, Loader2, Check, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { getBuddies } from '@/app/profile/buddy-actions'
import { transferGame } from '@/app/inventory/actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

export function GameTransferDialog({ game, currentUserId }: { game: any, currentUserId: string }) {
    const [open, setOpen] = useState(false)
    const [buddies, setBuddies] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [transferring, setTransferring] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (open) {
            async function fetchBuddies() {
                setLoading(true)
                const data = await getBuddies()
                setBuddies(data)
                setLoading(false)
            }
            fetchBuddies()
        }
    }, [open])

    async function handleTransfer(buddyId: string) {
        if (!confirm('Möchtest du dieses Spiel wirklich dauerhaft an deinen Buddy übertragen? Du bist dann nicht mehr der Besitzer.')) return

        setTransferring(buddyId)
        const result = await transferGame(game.id, buddyId)
        if (result.success) {
            setOpen(false)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            router.refresh()
        } else {
            alert(result.error)
        }
        setTransferring(null)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-500" title="Spiel übertragen">
                    <ArrowRightLeft className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 text-white">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <ArrowRightLeft className="w-8 h-8" /> Spiel übertragen
                    </DialogTitle>
                    <DialogDescription className="text-emerald-50 mt-2 opacity-90">
                        Übertrage "{game.name}" dauerhaft an ein anderes Mitglied.
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Wähle einen Buddy
                        </p>

                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : buddies.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Du hast noch keine Buddies.</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Finde zuerst Freunde in der Sidebar</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                                {buddies.map((b) => {
                                    const buddy = b.user_id === currentUserId ? b.buddy : b.user
                                    return (
                                        <button
                                            key={b.id}
                                            onClick={() => handleTransfer(buddy.id)}
                                            disabled={!!transferring}
                                            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-white">
                                                    {buddy.avatar_url ? (
                                                        <img src={buddy.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-emerald-600" />
                                                    )}
                                                </div>
                                                <p className="font-bold text-slate-700 text-sm">{buddy.full_name}</p>
                                            </div>
                                            {transferring === buddy.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                            ) : (
                                                <ArrowRightLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-slate-400 font-bold">
                        Abbrechen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
