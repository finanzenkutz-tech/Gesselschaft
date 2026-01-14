'use client'

import { useState } from 'react'
import { GroupMap } from '@/components/groups/group-map'
import { ChallengeDialog } from '@/components/groups/challenge-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Group {
    id: string
    name: string
    description?: string
    latitude: number
    longitude: number
    location_name?: string
    group_members?: { count: number }[]
}

interface MapPageClientProps {
    groups: Group[]
    myGroupIds: string[]
    myGroups: { id: string; name: string }[]
}

export function MapPageClient({ groups, myGroupIds, myGroups }: MapPageClientProps) {
    const [selectedChallengeGroup, setSelectedChallengeGroup] = useState<Group | null>(null)
    const [myChallengerGroupId, setMyChallengerGroupId] = useState<string>(
        myGroups.length > 0 ? myGroups[0].id : ''
    )
    const [searchTerm, setSearchTerm] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
    // We can also use a key to force re-render/reset map if needed, 
    // but just updating center via useEffect in GroupMap is better.

    const handleChallengeClick = (group: Group) => {
        if (myGroups.length === 0) {
            toast.error("Du musst Admin einer Gruppe sein.")
            return
        }
        setSelectedChallengeGroup(group)
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm.trim()) return

        setIsSearching(true)
        const term = searchTerm.toLowerCase()

        // 1. Local Search: Check if any group matches name or location name
        // (Case-insensitive fuzzy match could be better but startsWith/includes is ok for now)
        const foundGroup = groups.find(g =>
            g.name.toLowerCase().includes(term) ||
            (g.location_name && g.location_name.toLowerCase().includes(term))
        )

        if (foundGroup) {
            setMapCenter([foundGroup.latitude, foundGroup.longitude])
            toast.success(`Gruppe gefunden: ${foundGroup.name}`)
            // We could also select it automatically in the map, 
            // but GroupMap needs to expose that or controlled prop.
            // For now, centering is good.
        } else {
            // 2. Geocoding Search (Nominatim)
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=1`, {
                    headers: {
                        'User-Agent': 'BoardGameHub/1.0'
                    }
                })
                const data = await response.json()

                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat)
                    const lon = parseFloat(data[0].lon)
                    setMapCenter([lat, lon])
                    toast.success(`Ort gefunden: ${data[0].name || searchTerm}`)
                } else {
                    toast.error("Nichts gefunden.")
                }
            } catch (error) {
                console.error("Search failed:", error)
                toast.error("Suche fehlgeschlagen.")
            }
        }
        setIsSearching(false)
    }

    const challengerGroupName = myGroups.find(g => g.id === myChallengerGroupId)?.name || ''

    return (
        <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative h-full">
            <GroupMap
                groups={groups}
                myGroupIds={myGroupIds}
                height="100%"
                onChallengeClick={myGroups.length > 0 ? handleChallengeClick : undefined}
                mapCenter={mapCenter}
            />

            {/* Overlay Search */}
            <div className="absolute top-4 left-4 z-[1000] w-64 md:w-80">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Gruppe oder Ort suchen..."
                        className="w-full pl-9 pr-10 py-3 bg-white/90 backdrop-blur shadow-lg rounded-xl text-sm border-0 focus:ring-2 focus:ring-primary transition-all hover:bg-white"
                        disabled={isSearching}
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    )}
                </form>
            </div>

            {/* Challenge Dialog */}
            {selectedChallengeGroup && (
                <ChallengeDialog
                    open={!!selectedChallengeGroup}
                    onOpenChange={(open) => !open && setSelectedChallengeGroup(null)}
                    challengerGroupId={myChallengerGroupId}
                    challengerGroupName={challengerGroupName}
                    challengedGroupId={selectedChallengeGroup.id}
                    challengedGroupName={selectedChallengeGroup.name}
                    trigger={<div className="hidden" />}
                    onSuccess={() => setSelectedChallengeGroup(null)}
                />
            )}

            {/* Group Selector (Simplified) */}
            {selectedChallengeGroup && myGroups.length > 1 && (
                <div className="fixed inset-0 z-[1050] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="font-bold text-lg">Wähle deine Gruppe</h3>
                        <div className="space-y-2">
                            {myGroups.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setMyChallengerGroupId(g.id)}
                                    className={`w-full p-3 rounded-xl border-2 text-left font-bold transition-all ${myChallengerGroupId === g.id
                                            ? 'border-primary bg-blue-50 text-primary'
                                            : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>
                        <Button onClick={() => { }} className="w-full">Weiter</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
