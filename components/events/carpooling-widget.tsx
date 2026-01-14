'use client'

import { useState } from 'react'
import { Car, Plus, Users, UserPlus, UserMinus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { offerCarpool, joinCarpool, leaveCarpool } from '@/app/carpooling/actions'
import { useRouter } from 'next/navigation'

export function CarpoolingWidget({ eventId, carpools, userId }: { eventId: string, carpools: any[], userId?: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleOffer(formData: FormData) {
        setLoading(true)
        const res = await offerCarpool(formData)
        setLoading(false)
        if (res.success) {
            setOpen(false)
            router.refresh()
        } else {
            alert('Fehler: ' + res.error)
        }
    }

    async function handleJoin(carpoolId: string) {
        setLoading(true)
        const res = await joinCarpool(carpoolId, eventId)
        setLoading(false)
        if (res.success) router.refresh()
    }

    async function handleLeave(carpoolId: string) {
        setLoading(true)
        const res = await leaveCarpool(carpoolId, eventId)
        setLoading(false)
        if (res.success) router.refresh()
    }

    return (
        <section className="sky-card p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Car className="w-6 h-6 text-primary" />
                    Fahrgemeinschaften
                </h2>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-xl border-blue-100 text-primary font-bold hover:bg-blue-50">
                            Fahrt anbieten
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
                            <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                                <Car className="w-8 h-8" /> Fahrt anbieten
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 mt-2 opacity-90">
                                Wie viele Plätze hast du in deinem Auto frei?
                            </DialogDescription>
                        </div>
                        <form action={handleOffer} className="p-8 space-y-6">
                            <input type="hidden" name="event_id" value={eventId} />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Freie Plätze</label>
                                    <Input
                                        name="seats_available"
                                        type="number"
                                        min="1"
                                        max="8"
                                        defaultValue="3"
                                        required
                                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Details (Abfahrtsort, Zeit...)</label>
                                    <Input
                                        name="description"
                                        placeholder="Abfahrt 18:00 Paderborn Hbf"
                                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200">
                                {loading ? 'Speichere...' : 'Angebot erstellen'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                {carpools.length === 0 ? (
                    <p className="text-slate-400 text-sm italic py-4 text-center">Noch keine Fahrgemeinschaften angeboten.</p>
                ) : (
                    carpools.map((cp) => {
                        const isDriver = cp.driver_id === userId
                        const isPassenger = cp.carpool_passengers?.some((p: any) => p.passenger_id === userId)
                        const remainingSeats = cp.seats_available - (cp.carpool_passengers?.length || 0)

                        return (
                            <div key={cp.id} className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center font-bold border-2 border-primary/10 shadow-sm shrink-0">
                                        {cp.profiles?.full_name?.[0] || 'D'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">Fahrt von {cp.profiles?.full_name || 'Unbekannt'}</p>
                                        <p className="text-sm text-slate-500 font-medium">{cp.description || 'Keine Details'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-center md:text-right">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Plätze</p>
                                        <p className="font-extrabold text-primary">{remainingSeats} / {cp.seats_available}</p>
                                    </div>

                                    {isDriver ? (
                                        <div className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold uppercase">Du fährst</div>
                                    ) : isPassenger ? (
                                        <Button
                                            onClick={() => handleLeave(cp.id)}
                                            disabled={loading}
                                            variant="secondary"
                                            className="rounded-xl font-bold bg-white text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100"
                                        >
                                            Mitfahrt beenden
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleJoin(cp.id)}
                                            disabled={loading || remainingSeats <= 0}
                                            className="rounded-xl font-bold bg-primary text-white hover:bg-blue-600 shadow-md shadow-blue-100"
                                        >
                                            Mitfahren
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </section>
    )
}
