'use client'

import { useState, useEffect } from 'react'
import { Settings, Users, Plus, X, Dice5, MapPin } from 'lucide-react'
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
import { updateGroup } from '@/app/(app)/groups/actions'
import { useRouter } from 'next/navigation'
import { LocationPicker } from '@/components/groups/location-picker'

type Group = {
    id: string
    name: string
    description: string | null
    emoji: string | null
    latitude?: number
    longitude?: number
    location_name?: string
    is_location_public?: boolean
    zip_code?: string
}

export function EditGroupDialog({ group, trigger }: { group: Group, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedEmoji, setSelectedEmoji] = useState(group.emoji || '🎲')

    // Location State
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(
        group.latitude && group.longitude ? { lat: group.latitude, lng: group.longitude } : null
    )
    const [locationName, setLocationName] = useState(group.location_name || '')
    const [isPublic, setIsPublic] = useState(group.is_location_public || false)

    const router = useRouter()

    // Sync state when group prop changes (e.g. after refresh)
    useEffect(() => {
        setSelectedEmoji(group.emoji || '🎲')
        if (group.latitude && group.longitude) {
            setLocation({ lat: group.latitude, lng: group.longitude })
        } else {
            setLocation(null)
        }
        setLocationName(group.location_name || '')
        setIsPublic(group.is_location_public || false)
    }, [group])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        formData.append('id', group.id)
        formData.append('emoji', selectedEmoji)

        if (location) {
            formData.append('latitude', location.lat.toString())
            formData.append('longitude', location.lng.toString())
            formData.append('location_name', locationName || '') // Ensure name is sent
        } else {
            // Explicitly send empty to clear
            formData.append('latitude', '')
            formData.append('longitude', '')
            formData.append('location_name', '')
        }

        formData.append('is_location_public', isPublic.toString())

        try {
            const result = await updateGroup(formData)
            if (result.success) {
                setOpen(false)
                router.refresh()
            } else {
                setError(result.error || 'Fehler beim Aktualisieren')
            }
        } catch (e) {
            console.error(e)
            setError('Netzwerkfehler: Bitte prüfe deine Verbindung.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" className="border-2 border-slate-100 text-slate-600 rounded-xl hover:bg-slate-50 transition-all group">
                        <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="ml-2 hidden sm:inline">Gruppe bearbeiten</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white shrink-0">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Settings className="w-8 h-8" /> Gruppe bearbeiten
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        Passe den Namen, Standort und die Beschreibung deiner Gruppe an.
                    </DialogDescription>
                </div>

                <div className="overflow-y-auto p-8">
                    <form action={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-1">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" /> Gruppenname
                                    </label>
                                    <Input
                                        name="name"
                                        defaultValue={group.name}
                                        placeholder="z.B. Die Würfel-Räuber"
                                        required
                                        className="rounded-xl bg-slate-50 border-slate-100 h-12 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-secondary" /> Beschreibung
                                    </label>
                                    <Textarea
                                        name="description"
                                        defaultValue={group.description || ''}
                                        placeholder="Was zeichnet eure Gruppe aus?"
                                        className="rounded-xl bg-slate-50 border-slate-100 min-h-[120px] focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Dice5 className="w-4 h-4 text-primary" /> Gruppen-Emoji
                                    </label>
                                    <div className="grid grid-cols-7 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        {['🎲', '🃏', '🏰', '⚔️', '🗺️', '🧩', '♟️', '🎩', '💰', '🏠', '🐉', '🧟', '🚀', '🎭', '⏳', '🏆', '🔥', '🪵', '🌾', '🐑', '🧱'].map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setSelectedEmoji(emoji)}
                                                className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all ${selectedEmoji === emoji ? 'bg-primary text-white shadow-md scale-110' : 'bg-white hover:bg-white/80 text-slate-600'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-4">
                                    {/* Zip Code (Still manual for now if preferred, or could be derived) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" /> PLZ *
                                        </label>
                                        <Input
                                            name="zip_code"
                                            defaultValue={group.zip_code || ''}
                                            placeholder="z.B. 10115"
                                            required
                                            className="rounded-xl bg-slate-50 border-slate-100 h-12 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-blue-400" /> Standort auf Karte
                                        </label>
                                        <LocationPicker
                                            value={location ? [location.lat, location.lng] : null}
                                            onChange={(lat, lng) => setLocation({ lat, lng })}
                                            initialName={locationName}
                                            onNameChange={setLocationName}
                                            initialPublic={isPublic}
                                            onPublicChange={setIsPublic}
                                            showSaveButton={false} // Saving happens via main form
                                            height="h-56"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="flex-1 rounded-xl h-12 font-bold text-slate-500"
                            >
                                Abbrechen
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200 transition-all"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Speichere...</span>
                                    </div>
                                ) : 'Änderungen speichern'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

