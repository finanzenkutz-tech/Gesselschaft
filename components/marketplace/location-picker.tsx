'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MarketplaceLocationPickerProps {
    initialLat?: number | null
    initialLng?: number | null
    initialName?: string | null
    onLocationChange: (location: { lat: number; lng: number; name: string }) => void
}

export function MarketplaceLocationPicker({
    initialLat,
    initialLng,
    initialName,
    onLocationChange
}: MarketplaceLocationPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    )
    const [locationName, setLocationName] = useState(initialName || '')
    const [searchQuery, setSearchQuery] = useState('')
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)

    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current || mapInstanceRef.current) return

            const L = (await import('leaflet')).default
            await import('leaflet/dist/leaflet.css')

            // Fix Leaflet icons in Next.js
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            const center: [number, number] = position || [51.1657, 10.4515] // Germany center
            const zoom = position ? 13 : 6

            const map = L.map(mapRef.current, {
                center,
                zoom,
                scrollWheelZoom: false
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map)

            if (position) {
                markerRef.current = L.marker(position).addTo(map)
            }

            map.on('click', async (e: any) => {
                const { lat, lng } = e.latlng
                updatePosition(lat, lng)
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

    const updatePosition = async (lat: number, lng: number, name?: string) => {
        setPosition([lat, lng])

        if (mapInstanceRef.current) {
            const L = (await import('leaflet')).default
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng])
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current)
            }
            mapInstanceRef.current.setView([lat, lng], 13)
        }

        let newName = name || locationName
        if (!name) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                const data = await res.json()
                newName = data.address.city || data.address.town || data.address.village || data.address.municipality || locationName
                setLocationName(newName)
            } catch (e) {
                console.error('Geocoding failed', e)
            }
        } else {
            setLocationName(name)
        }

        onLocationChange({ lat, lng, name: newName })
    }

    const handleSearch = async () => {
        if (!searchQuery) return
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0]
                // Simplistic name extraction
                const name = display_name.split(',')[0]
                updatePosition(parseFloat(lat), parseFloat(lon), name)
            } else {
                alert('Ort nicht gefunden')
            }
        } catch (e) {
            alert('Suche fehlgeschlagen')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Ort suchen..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                />
                <Button type="button" variant="outline" onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                </Button>
            </div>

            <div className="h-64 rounded-xl border border-slate-200 overflow-hidden relative z-0" ref={mapRef} />

            <div className="space-y-2">
                <Label>Gewählter Standort</Label>
                <Input
                    name="location"
                    value={locationName}
                    onChange={e => {
                        setLocationName(e.target.value)
                        if (position) {
                            onLocationChange({ lat: position[0], lng: position[1], name: e.target.value })
                        }
                    }}
                    placeholder="Klicke auf die Karte..."
                />
                {position && (
                    <>
                        <input type="hidden" name="lat" value={position[0]} />
                        <input type="hidden" name="lng" value={position[1]} />
                    </>
                )}
            </div>
        </div>
    )
}
