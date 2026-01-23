'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Save, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateGroupLocation } from '@/app/groups/challenge-actions'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface LocationPickerProps {
    // For standalone mode (Group Location)
    groupId?: string
    initialPublic?: boolean

    // For Controlled mode (Form Input)
    value?: [number, number] | null
    onChange?: (lat: number, lng: number, name?: string) => void

    // Common
    initialLat?: number
    initialLng?: number
    initialName?: string
    onSuccess?: () => void

    // Styling
    height?: string
    showSaveButton?: boolean
    showPublicSwitch?: boolean
    showNameInput?: boolean
}

export function LocationPicker({
    groupId,
    initialLat,
    initialLng,
    initialName,
    initialPublic = true,
    value,
    onChange,
    onSuccess,
    height = "h-64",
    showSaveButton = true,
    showPublicSwitch = true,
    showNameInput = true
}: LocationPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        value || (initialLat && initialLng ? [initialLat, initialLng] : null)
    )
    const [locationName, setLocationName] = useState(initialName || '')
    const [isPublic, setIsPublic] = useState(initialPublic)
    const [isSaving, setIsSaving] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)

    // Sync external value if provided
    useEffect(() => {
        if (value) {
            setPosition(value)
            if (mapInstanceRef.current && markerRef.current) {
                markerRef.current.setLatLng(value)
                mapInstanceRef.current.panTo(value)
            }
        }
    }, [value])

    useEffect(() => {
        // Dynamic import Leaflet
        const initMap = async () => {
            if (!mapRef.current || mapInstanceRef.current) return

            const L = (await import('leaflet')).default

            const center: [number, number] = position || [51.1657, 10.4515]
            const zoom = position ? 13 : 6

            const map = L.map(mapRef.current, {
                center,
                zoom
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map)

            // Custom Icon
            const icon = L.divIcon({
                className: 'custom-pin',
                html: `<div style="font-size: 24px;">📍</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })

            if (position) {
                markerRef.current = L.marker(position, { icon }).addTo(map)
            }

            // Click handler
            map.on('click', async (e: any) => {
                const { lat, lng } = e.latlng
                const newPos: [number, number] = [lat, lng]
                setPosition(newPos)

                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng])
                } else {
                    markerRef.current = L.marker([lat, lng], { icon }).addTo(map)
                }

                // Reverse Geocoding (Nominatim)
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                    const data = await res.json()

                    const city = data.address.city || data.address.town || data.address.village || data.address.municipality
                    const road = data.address.road
                    const house_number = data.address.house_number

                    let bestName = city
                    if (road) bestName = `${road} ${house_number || ''}, ${city}`.trim()

                    if (bestName) {
                        setLocationName(bestName)
                    }

                    if (onChange) {
                        onChange(lat, lng, bestName)
                    }
                } catch (error) {
                    console.error('Geocoding failed', error)
                    if (onChange) {
                        onChange(lat, lng)
                    }
                }
            })

            mapInstanceRef.current = map
        }

        initMap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    const handleSave = async () => {
        if (!position || !groupId) return

        setIsSaving(true)
        const result = await updateGroupLocation(
            groupId,
            position[0],
            position[1],
            locationName,
            isPublic
        )

        if (result.success) {
            toast.success('Standort gespeichert')
            onSuccess?.()
        } else {
            toast.error(result.error)
        }
        setIsSaving(false)
    }

    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
                headers: {
                    'User-Agent': 'BoardGameHub/1.0'
                }
            })
            const data = await response.json()
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat)
                const lon = parseFloat(data[0].lon)
                const newPos: [number, number] = [lat, lon]

                setPosition(newPos)

                // Update Name if empty
                if (!locationName) {
                    const name = data[0].name || data[0].display_name.split(',')[0]
                    setLocationName(name)
                }

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo(newPos, 13)
                    if (markerRef.current) {
                        markerRef.current.setLatLng(newPos)
                    } else {
                        // Re-create marker if needed
                        const L = (await import('leaflet')).default
                        const icon = L.divIcon({
                            className: 'custom-pin',
                            html: `<div style="font-size: 24px;">📍</div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        })
                        markerRef.current = L.marker(newPos, { icon }).addTo(mapInstanceRef.current)
                    }
                }

                if (onChange) {
                    // If we found a name, maybe pass it? 
                    // onChange(lat, lon, locationName || ...) 
                    // For now just update lat/lon
                    onChange(lat, lon)
                }
            } else {
                toast.error('Ort nicht gefunden')
            }
        } catch (error) {
            console.error('Search failed:', error)
            toast.error('Suche fehlgeschlagen')
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="space-y-4">
            {showNameInput && (
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Stadt oder Ort suchen..."
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
                    />
                    <Button type="submit" variant="secondary" disabled={isSearching} className="h-auto py-2">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                </form>
            )}

            <div className="space-y-2">
                <p className="text-sm text-slate-500">
                    Oder klicke auf die Karte, um den Standort zu wählen.
                </p>
                <div
                    ref={mapRef}
                    className={`${height} rounded-xl border border-slate-200 overflow-hidden relative z-0`}
                />
            </div>

            <div className="grid gap-4">
                {showNameInput && (
                    <div className="space-y-2">
                        <Label>Standortname / Adresse</Label>
                        <input
                            type="text"
                            value={locationName}
                            onChange={(e) => {
                                setLocationName(e.target.value)
                                if (onChange && position) {
                                    onChange(position[0], position[1], e.target.value)
                                }
                            }}
                            placeholder="z.B. Berlin, Spielekeller..."
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
                )}

                {showPublicSwitch && (
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-slate-50">
                        <div className="space-y-0.5">
                            <Label className="text-base">Öffentlich sichtbar</Label>
                            <p className="text-xs text-slate-500">
                                Andere Gruppen können deinen Standort auf der Karte sehen.
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                )}

                {showSaveButton && groupId && (
                    <Button
                        onClick={handleSave}
                        disabled={!position || isSaving}
                        className="w-full"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Standort speichern
                    </Button>
                )}
            </div>
        </div>
    )
}
