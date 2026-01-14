'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, FileText, Dice5, Plus, X, Repeat } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createEvent } from '@/app/events/actions'
import confetti from 'canvas-confetti'

type Place = { id: string; name: string; address?: string }

export function CreateEventDialog({ groups, defaultGroupId, places = [] }: { groups: any[], defaultGroupId?: string, places?: Place[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedLocation, setSelectedLocation] = useState('')
    const [customLocation, setCustomLocation] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        try {
            const result = await createEvent(formData)
            if (result.success) {
                // 🎉 Fire confetti on success!
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
                })
                setTimeout(() => {
                    confetti({
                        particleCount: 80,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.7 }
                    })
                    confetti({
                        particleCount: 80,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.7 }
                    })
                }, 200)

                setOpen(false)
                router.refresh()
            } else {
                setError(result.error || 'Unbekannter Fehler')
            }
        } catch (e) {
            console.error(e)
            setError('Netzwerkfehler beim Erstellen')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-blue-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-blue-200">
                    <Plus className="w-5 h-5 mr-2" /> Event planen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white relative">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Calendar className="w-8 h-8" /> Event planen
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        Organisiere deinen nächsten Spieleabend in wenigen Schritten.
                    </DialogDescription>
                </div>

                <form action={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Titel des Events</label>
                            <div className="relative">
                                <Input
                                    name="title"
                                    placeholder="Z.B. Catan Abend"
                                    required
                                    className="pl-11 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 h-12"
                                />
                                <Dice5 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Gruppe wählen</label>
                            <select
                                name="group_id"
                                required
                                defaultValue={defaultGroupId || ""}
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-primary/20 text-sm outline-none"
                            >
                                <option value="" disabled>Wähle eine deiner Gruppen...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Datum & Zeit</label>
                                <Input
                                    name="start_time"
                                    type="datetime-local"
                                    required
                                    className="rounded-xl bg-slate-50 border-slate-100 focus:bg-white h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Ende (optional)</label>
                                <Input
                                    name="end_time"
                                    type="datetime-local"
                                    className="rounded-xl bg-slate-50 border-slate-100 focus:bg-white h-12"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Ort</label>
                            {places.length > 0 && !customLocation ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <select
                                            name="location"
                                            value={selectedLocation}
                                            onChange={(e) => {
                                                if (e.target.value === '__custom__') {
                                                    setCustomLocation(true)
                                                    setSelectedLocation('')
                                                } else {
                                                    setSelectedLocation(e.target.value)
                                                }
                                            }}
                                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white text-sm outline-none appearance-none"
                                        >
                                            <option value="">Ort auswählen...</option>
                                            {places.map(place => (
                                                <option key={place.id} value={place.name}>
                                                    {place.name} {place.address ? `(${place.address})` : ''}
                                                </option>
                                            ))}
                                            <option value="__custom__">✏️ Anderen Ort eingeben...</option>
                                        </select>
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Input
                                            name="location"
                                            placeholder="Bei Markus / Online / etc."
                                            className="pl-11 rounded-xl bg-slate-50 border-slate-100 focus:bg-white h-12"
                                        />
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                    {places.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCustomLocation(false)}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            ← Gespeicherte Orte anzeigen
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Wiederholung</label>
                            <div className="relative">
                                <select
                                    name="recurrence"
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white text-sm outline-none appearance-none"
                                    defaultValue="none"
                                >
                                    <option value="none">Keine Wiederholung (Einmalig)</option>
                                    <option value="weekly">Wöchentlich (für 8 Wochen)</option>
                                </select>
                                <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">
                                Erstellt automatisch Termine für die nächsten 2 Monate.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Beschreibung</label>
                            <div className="relative">
                                <Textarea
                                    name="description"
                                    placeholder="Was wird gespielt? Sollen wir Snacks mitbringen?"
                                    className="pl-11 rounded-xl bg-slate-50 border-slate-100 focus:bg-white min-h-[100px]"
                                />
                                <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="flex-1 rounded-xl border-slate-100 h-12 font-bold"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200"
                        >
                            {loading ? 'Plant...' : 'Event planen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
