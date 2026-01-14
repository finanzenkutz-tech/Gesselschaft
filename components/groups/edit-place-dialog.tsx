'use client'

import { useState } from 'react'
import { MapPin, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { updateGroupPlace } from '@/app/groups/place-actions'
import { useRouter } from 'next/navigation'
import { LocationPicker } from '@/components/groups/location-picker'
import { PLACE_AMENITIES } from '@/lib/constants/amenities'

type Place = {
    id: string
    name: string
    address: string | null
    services: string | null
    description: string | null
    latitude: number | null
    longitude: number | null
    amenities: string[] | null
    created_by: string
}

export function EditPlaceDialog({ place, groupId }: { place: Place, groupId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(
        place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : null
    )
    const [amenities, setAmenities] = useState<string[]>(place.amenities || [])

    const router = useRouter()

    function toggleAmenity(id: string) {
        setAmenities(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.append('group_id', groupId)
        formData.append('id', place.id)

        if (coordinates) {
            formData.append('latitude', coordinates.lat.toString())
            formData.append('longitude', coordinates.lng.toString())
        }

        formData.append('amenities', JSON.stringify(amenities))

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
                <button className="text-slate-300 hover:text-blue-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Pencil className="w-4 h-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-8 text-white shrink-0">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Pencil className="w-8 h-8" /> Ort bearbeiten
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        {place.name} anpassen
                    </DialogDescription>
                </div>
                <div className="overflow-y-auto p-8">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Name des Ortes</label>
                                    <Input name="name" defaultValue={place.name} required className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Adresse</label>
                                    <Input name="address" defaultValue={place.address || ''} className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Beschreibung / Hinweise</label>
                                    <textarea
                                        name="description"
                                        defaultValue={place.description || ''}
                                        placeholder="Zusatzinfos..."
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Ausstattung</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PLACE_AMENITIES.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleAmenity(opt.id)}
                                                className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-all border ${amenities.includes(opt.id)
                                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span>{opt.icon}</span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Input name="services" defaultValue={place.services || ''} placeholder="Sonstiges..." className="rounded-xl bg-slate-50 border-slate-100 h-12 mt-2" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Auf der Karte</label>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                        <LocationPicker
                                            initialLat={coordinates?.lat || 51.1657}
                                            initialLng={coordinates?.lng || 10.4515}
                                            value={coordinates ? [coordinates.lat, coordinates.lng] : null}
                                            height="h-[300px]"
                                            showSaveButton={false}
                                            showPublicSwitch={false}
                                            showNameInput={false}
                                            onChange={(lat, lng) => setCoordinates({ lat, lng })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 px-1">
                                        {coordinates ? `Position: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : 'Keine Position gewählt'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200 mt-4">
                            {loading ? 'Speichere...' : 'Änderungen speichern'}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
