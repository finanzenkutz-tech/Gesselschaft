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
import { addGroupPlace } from '@/app/(app)/groups/place-actions'
import { useRouter } from 'next/navigation'
import { LocationPicker } from '@/components/groups/location-picker'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Camera, ShieldCheck } from 'lucide-react'

import { PLACE_AMENITIES } from '@/lib/constants/amenities'

export function AddPlaceDialog({ groupId, trigger, onSuccess }: { groupId: string, trigger?: React.ReactNode, onSuccess?: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null)
    const [amenities, setAmenities] = useState<string[]>([])
    const [isPrivate, setIsPrivate] = useState(false)

    const router = useRouter()

    const amenityOptions = PLACE_AMENITIES

    function toggleAmenity(id: string) {
        setAmenities(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.append('group_id', groupId)

        if (coordinates) {
            formData.append('latitude', coordinates.lat.toString())
            formData.append('longitude', coordinates.lng.toString())
        }

        formData.append('amenities', JSON.stringify(amenities))
        formData.append('is_private', isPrivate.toString())

        const result = await addGroupPlace(formData)
        setLoading(false)
        if (result.success) {
            setOpen(false)
            setCoordinates(null)
            setAmenities([])
            router.refresh()
            onSuccess?.()
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
            <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white shrink-0">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <MapPin className="w-8 h-8" /> Ort hinzufügen
                    </DialogTitle>
                    <DialogDescription className="text-red-100 mt-2 opacity-90">
                        Wo spielen wir als nächstes?
                    </DialogDescription>
                </div>
                <div className="overflow-y-auto p-8">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <label className="text-sm font-bold text-slate-700 ml-1">Beschreibung / Hinweise</label>
                                    <textarea
                                        name="description"
                                        placeholder="Zusatzinfos wie 'Hinterhof Eingang' oder 'Code 1234'..."
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Ausstattung & Services</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {amenityOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleAmenity(opt.id)}
                                                className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-all border ${amenities.includes(opt.id)
                                                    ? 'bg-red-50 border-red-200 text-red-600'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span>{opt.icon}</span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Input name="services" placeholder="Sonstiges (Freitext)..." className="rounded-xl bg-slate-50 border-slate-100 h-12 mt-2" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold text-slate-700">Privater Gastgeber?</Label>
                                            <p className="text-[10px] text-slate-400 font-medium">Nur für Mitglieder sichtbar</p>
                                        </div>
                                        <Switch
                                            checked={isPrivate}
                                            onCheckedChange={setIsPrivate}
                                        />
                                    </div>

                                    {isPrivate && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Infos für Gäste</label>
                                            <textarea
                                                name="host_info"
                                                placeholder="z.B. 'Habe eine Katze', 'Parken im Hof möglich', 'Bitte Straßenschuhe ausziehen'"
                                                className="w-full p-3 rounded-xl bg-white border border-slate-200 min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-slate-400" /> Bild-URL (Optional)
                                    </label>
                                    <Input name="image_url" placeholder="https://..." className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Auf der Karte markieren</label>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                        <LocationPicker
                                            initialLat={51.1657}
                                            initialLng={10.4515}
                                            height="h-[300px]"
                                            showSaveButton={false}
                                            showPublicSwitch={false}
                                            showNameInput={false}
                                            onChange={(lat, lng, name) => {
                                                setCoordinates({ lat, lng })
                                                if (name) {
                                                    // Optional: auto-fill address if empty? For now just tracking coords
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 px-1">
                                        {coordinates ? `Gewählt: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : 'Bitte Klick auf die Karte'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-200 mt-4">
                            {loading ? 'Speichere...' : 'Ort speichern'}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

