'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, Info, Navigation, Coffee, ShieldCheck } from 'lucide-react'
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
import { addGroupPlace, deleteGroupPlace, updateGroupPlace } from '@/app/(app)/groups/place-actions'
import { useRouter } from 'next/navigation'
import { AddPlaceDialog } from '@/components/groups/add-place-dialog'
import { PLACE_AMENITIES } from '@/lib/constants/amenities'
import { ViewPlaceMapDialog } from './view-place-map-dialog'
import { LocationPicker } from '@/components/groups/location-picker'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type Place = {
    id: string
    name: string
    address: string | null
    services: string | null
    description: string | null
    latitude: number | null
    longitude: number | null
    amenities: string[] | null
    image_url: string | null
    is_private: boolean | null
    host_info: string | null
    created_by: string
}

import { EditPlaceDialog } from './edit-place-dialog'
import { PlaceRating } from './place-rating'

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
    const router = useRouter()

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
        <section className="sky-card p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-red-500" />
                    Treffpunkte & Orte
                </h2>

                {isMember && (
                    <AddPlaceDialog groupId={groupId} />
                )}
            </div>

            {places.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 font-medium">Noch keine Orte für diese Gruppe hinterlegt.</p>
                    {isMember && (
                        <div className="mt-4">
                            <AddPlaceDialog groupId={groupId} />
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {places.map((place) => (
                        <div key={place.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
                            {place.image_url && (
                                <div className="h-32 w-full relative overflow-hidden">
                                    <img src={place.image_url} alt={place.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                            )}
                            <div className="p-5 flex items-start justify-between">
                                <div className="space-y-4 flex-1 min-w-0">
                                    <div className="flex items-center justify-between mr-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                                <Navigation className="w-4 h-4" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800">{place.name}</h3>
                                                {place.is_private && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full border border-amber-200">
                                                        <ShieldCheck className="w-3 h-3" /> Privater Host
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {place.latitude && place.longitude && (
                                            <ViewPlaceMapDialog
                                                latitude={place.latitude}
                                                longitude={place.longitude}
                                                name={place.name}
                                            />
                                        )}
                                    </div>

                                    {place.address && (
                                        <div className="flex items-start gap-2 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>{place.address}</span>
                                        </div>
                                    )}

                                    {place.description && (
                                        <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-2">
                                            {place.description}
                                        </p>
                                    )}

                                    {/* Amenities Badges */}
                                    {place.amenities && place.amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {place.amenities.map(amId => {
                                                const am = PLACE_AMENITIES.find(a => a.id === amId)
                                                if (!am) return null
                                                return (
                                                    <span key={amId} className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-slate-100 flex items-center gap-1">
                                                        <span>{am.icon}</span> {am.label}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {place.services && (
                                        <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                            <Coffee className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span className="font-medium">{place.services}</span>
                                        </div>
                                    )}

                                    {/* Private Host Info (visible only to members) */}
                                    {place.is_private && isMember && place.host_info && (
                                        <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl space-y-1.5">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.1em]">Gastgeber-Hinweis</p>
                                            <p className="text-xs text-slate-600 font-medium italic">"{place.host_info}"</p>
                                        </div>
                                    )}

                                    {/* Rating System */}
                                    <div className="flex items-center justify-between pt-2">
                                        <PlaceRating placeId={place.id} currentUserId={currentUserId} />
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                            Beliebter Ort
                                        </div>
                                    </div>
                                </div>

                                {(isAdmin || place.created_by === currentUserId) && (
                                    <div className="flex flex-col gap-1">
                                        <EditPlaceDialog place={place} groupId={groupId} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(place.id)}
                                            title="Ort löschen"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

