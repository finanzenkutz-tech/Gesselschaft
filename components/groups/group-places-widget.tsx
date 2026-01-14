'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, Info, Navigation, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { addGroupPlace, deleteGroupPlace } from '@/app/groups/place-actions'
import { useRouter } from 'next/navigation'

type Place = {
    id: string
    name: string
    address: string | null
    services: string | null
    created_by: string
}

export function GroupPlacesWidget({
    groupId,
    places,
    isMember,
    isAdmin,
    currentUserId
}: {
    groupId: string
    places: Place[]
    isMember: boolean
    isAdmin: boolean
    currentUserId?: string
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.append('group_id', groupId)
        const result = await addGroupPlace(formData)
        setLoading(false)
        if (result.success) {
            setOpen(false)
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    async function handleDelete(placeId: string) {
        if (!confirm('Diesen Ort wirklich löschen?')) return
        const result = await deleteGroupPlace(placeId, groupId)
        if (result.success) {
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    return (
        <section className="sky-card p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-red-500" />
                    Treffpunkte & Orte
                </h2>

                {isMember && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-red-100 text-red-500 hover:bg-red-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Ort hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
                                <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                                    <MapPin className="w-8 h-8" /> Ort hinzufügen
                                </DialogTitle>
                                <DialogDescription className="text-red-100 mt-2 opacity-90">
                                    Wo spielen wir als nächstes?
                                </DialogDescription>
                            </div>
                            <form action={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Name des Ortes</label>
                                        <Input name="name" placeholder="z.B. Brettspiel-Café Würfelglück" required className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Adresse</label>
                                        <Input name="address" placeholder="Musterstraße 1, 12345 Stadt" className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Services / Ausstattung</label>
                                        <Input name="services" placeholder="z.B. WLAN, Kaltgetränke, Snacks" className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-200">
                                    {loading ? 'Speichere...' : 'Ort speichern'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {places.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 font-medium">Noch keine Orte für diese Gruppe hinterlegt.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {places.map(place => (
                        <div key={place.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                            <Navigation className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-800">{place.name}</h3>
                                    </div>

                                    {place.address && (
                                        <div className="flex items-start gap-2 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>{place.address}</span>
                                        </div>
                                    )}

                                    {place.services && (
                                        <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                            <Coffee className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span className="font-medium">{place.services}</span>
                                        </div>
                                    )}
                                </div>

                                {(isAdmin || place.created_by === currentUserId) && (
                                    <button
                                        onClick={() => handleDelete(place.id)}
                                        className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
