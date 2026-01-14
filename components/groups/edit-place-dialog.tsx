'use client'

import { useState } from 'react'
import { MapPin, Edit3 } from 'lucide-react'
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
import { updateGroupPlace } from '@/app/groups/place-actions'
import { useRouter } from 'next/navigation'

type Place = {
    id: string
    name: string
    address: string | null
    services: string | null
}

export function EditPlaceDialog({ place, groupId }: { place: Place, groupId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.append('id', place.id)
        formData.append('group_id', groupId)
        const result = await updateGroupPlace(formData)
        setLoading(false)
        if (result.success) {
            setOpen(false)
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="text-slate-300 hover:text-primary p-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Edit3 className="w-4 h-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-8 text-white">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <MapPin className="w-8 h-8" /> Ort bearbeiten
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        Passe die Details für diesen Treffpunkt an.
                    </DialogDescription>
                </div>
                <form action={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Name des Ortes</label>
                            <Input
                                name="name"
                                defaultValue={place.name}
                                placeholder="z.B. Brettspiel-Café Würfelglück"
                                required
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Adresse</label>
                            <Input
                                name="address"
                                defaultValue={place.address || ''}
                                placeholder="Musterstraße 1, 12345 Stadt"
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Services / Ausstattung</label>
                            <Input
                                name="services"
                                defaultValue={place.services || ''}
                                placeholder="z.B. WLAN, Kaltgetränke, Snacks"
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200"
                    >
                        {loading ? 'Speichere...' : 'Änderungen speichern'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
