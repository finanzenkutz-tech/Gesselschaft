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
import { AddPlaceDialog } from '@/components/groups/add-place-dialog'

type Place = {
    id: string
    name: string
    address: string | null
    services: string | null
    created_by: string
}

import { EditPlaceDialog } from './edit-place-dialog'

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
        <section className="sky-card p-8 space-y-6">
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
                                    <div className="flex flex-col gap-1">
                                        <EditPlaceDialog place={place} groupId={groupId} />
                                        <button
                                            onClick={() => handleDelete(place.id)}
                                            className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
