'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Users, Swords, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Group {
    id: string
    name: string
    description?: string
    latitude: number
    longitude: number
    location_name?: string
    zip_code?: string
    group_members?: { count: number }[]
}

interface GroupMapProps {
    groups: Group[]
    myGroupIds?: string[]
    onChallengeClick?: (group: Group) => void
    selectedGroupId?: string
    height?: string
    mapCenter?: [number, number] | null
}

export function GroupMap({
    groups,
    myGroupIds = [],
    onChallengeClick,
    selectedGroupId,
    height = '500px',
    mapCenter
}: GroupMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    // Handle mapCenter updates
    useEffect(() => {
        if (mapInstanceRef.current && mapCenter) {
            mapInstanceRef.current.flyTo(mapCenter, 13)
        }
    }, [mapCenter])

    useEffect(() => {
        if (!isClient || !mapRef.current || mapInstanceRef.current) return

        // Dynamic import of Leaflet
        const initMap = async () => {
            const L = (await import('leaflet')).default
            // CSS is imported globally in layout.tsx

            // Default center (Germany)
            const defaultCenter: [number, number] = [51.1657, 10.4515]
            const defaultZoom = 6

            // Create map
            const map = L.map(mapRef.current!, {
                center: defaultCenter,
                zoom: defaultZoom,
                scrollWheelZoom: true
            })

            // Add tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map)

            // Custom marker icons
            const createIcon = (color: string) => L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    width: 32px; 
                    height: 32px; 
                    background: ${color}; 
                    border-radius: 50% 50% 50% 0; 
                    transform: rotate(-45deg);
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <span style="transform: rotate(45deg); font-size: 14px;">🎲</span>
                </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            })

            const myGroupIcon = createIcon('#22c55e') // green
            const otherGroupIcon = createIcon('#3b82f6') // blue
            const selectedIcon = createIcon('#f59e0b') // amber

            // Add markers for each group
            groups.forEach(group => {
                const isMyGroup = myGroupIds.includes(group.id)
                const isSelected = group.id === selectedGroupId

                const icon = isSelected ? selectedIcon : isMyGroup ? myGroupIcon : otherGroupIcon

                const marker = L.marker([group.latitude, group.longitude], { icon })
                    .addTo(map)

                marker.on('click', () => {
                    setSelectedGroup(group)
                })
            })

            // If there's a selected group, center on it
            if (selectedGroupId) {
                const selected = groups.find(g => g.id === selectedGroupId)
                if (selected) {
                    map.setView([selected.latitude, selected.longitude], 10)
                }
            } else if (groups.length > 0) {
                // Fit bounds to show all groups
                const bounds = L.latLngBounds(groups.map(g => [g.latitude, g.longitude]))
                map.fitBounds(bounds, { padding: [50, 50] })
            }

            mapInstanceRef.current = map
        }

        initMap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [isClient, groups, myGroupIds, selectedGroupId])

    if (!isClient) {
        return (
            <div
                style={{ height }}
                className="bg-slate-100 rounded-2xl flex items-center justify-center"
            >
                <div className="text-slate-400 flex items-center gap-2">
                    <MapPin className="w-5 h-5 animate-pulse" />
                    Karte wird geladen...
                </div>
            </div>
        )
    }

    return (
        <div className="relative" style={{ height }}>
            <div
                ref={mapRef}
                className="rounded-2xl overflow-hidden shadow-lg h-full"
            />

            {/* Selected Group Info Card */}
            {selectedGroup && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000]">
                    <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedGroup.name}</h3>
                                {selectedGroup.location_name && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {selectedGroup.zip_code ? `${selectedGroup.zip_code} ${selectedGroup.location_name}` : selectedGroup.location_name}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedGroup(null)}
                                title="Schließen"
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {selectedGroup.description && (
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                                {selectedGroup.description}
                            </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {selectedGroup.group_members?.[0]?.count || 0} Mitglieder
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/groups/${selectedGroup.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full rounded-xl">
                                    Ansehen
                                </Button>
                            </Link>
                            {!myGroupIds.includes(selectedGroup.id) && onChallengeClick && (
                                <Button
                                    size="sm"
                                    className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                    onClick={() => onChallengeClick(selectedGroup)}
                                >
                                    <Swords className="w-4 h-4 mr-1" />
                                    Herausfordern
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg text-xs space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-slate-600">Meine Gruppen</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-slate-600">Andere Gruppen</span>
                </div>
            </div>
        </div>
    )
}
