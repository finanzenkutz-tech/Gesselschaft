'use client'

import { useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
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
import { addGroupPlace } from '@/app/groups/place-actions'
import { useRouter } from 'next/navigation'

export function AddPlaceDialog({ groupId, trigger }: { groupId: string, trigger?: React.ReactNode }) {
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="rounded-xl border-red-100 text-red-500 hover:bg-red-50">
                        <Plus className="w-4 h-4 mr-2" />
                        Ort hinzufügen
                    </Button>
                )}
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
    )
}
