'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { checkIn, getCheckedInUsers } from '@/app/events/check-in-actions'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface DigitalCheckInDialogProps {
    eventId: string
    eventTitle: string
    location?: string | null
}

interface CheckedInUser {
    id: string
    full_name: string | null
    avatar_url: string | null
    checked_in_at: string
}

export function DigitalCheckInDialog({ eventId, eventTitle, location }: DigitalCheckInDialogProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<CheckedInUser[]>([])
    const [fetchingUsers, setFetchingUsers] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getCheckedInUsers(eventId)
                setUsers(data)
            } catch (error) {
                console.error("Failed to fetch checked in users", error)
            } finally {
                setFetchingUsers(false)
            }
        }
        fetchUsers()

        // Realtime subscription could be added here, but maybe overkill for now.
        // Polling every 10s?
        const interval = setInterval(fetchUsers, 10000)
        return () => clearInterval(interval)
    }, [eventId])

    const handleCheckIn = async () => {
        setLoading(true)
        try {
            await checkIn(eventId)
            toast.success("Erfolgreich eingecheckt! Viel Spaß!")
            setIsOpen(false)
        } catch (error) {
            toast.error("Check-in fehlgeschlagen")
        } finally {
            setLoading(false)
        }
    }

    // Only show if open
    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transform translate-x-4 -translate-y-4">
                        <CheckCircle2 className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 animate-pulse">
                            <MapPin className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black mb-2">Bist du schon da?</DialogTitle>
                        <DialogDescription className="text-emerald-50 font-medium">
                            Das Event <strong>{eventTitle}</strong> läuft gerade!
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center">
                            Bereits eingecheckt
                        </h4>

                        {fetchingUsers ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            </div>
                        ) : users.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-2">
                                {users.slice(0, 5).map((u, i) => (
                                    <motion.div
                                        key={u.id}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col items-center"
                                        title={u.full_name || 'Spieler'}
                                    >
                                        <div className="relative">
                                            <Avatar className="w-12 h-12 border-2 border-white shadow-md ring-2 ring-emerald-100">
                                                <AvatarImage src={u.avatar_url || undefined} />
                                                <AvatarFallback className="bg-emerald-100 text-emerald-600 font-bold">
                                                    {u.full_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1 text-center truncate w-16">
                                            {u.full_name?.split(' ')[0]}
                                        </span>
                                    </motion.div>
                                ))}
                                {users.length > 5 && (
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold border-2 border-white shadow-md">
                                        +{users.length - 5}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-slate-400 italic">
                                Noch niemand eingecheckt. Sei der Erste!
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleCheckIn}
                            disabled={loading}
                            className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle2 className="w-6 h-6 mr-2" />}
                            Ja, ich bin da!
                        </Button>
                        <Button
                            onClick={() => setIsOpen(false)}
                            variant="ghost"
                            className="text-slate-400 font-bold hover:bg-slate-50 rounded-xl"
                        >
                            Später
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
