'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Search, Filter, MapPin, X, Bell } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { saveSearch } from '@/app/marketplace/actions'
import { toast } from 'sonner'

export function MarketplaceFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [type, setType] = useState(searchParams.get('type') || 'all')
    const [category, setCategory] = useState(searchParams.get('category') || 'all')
    const [condition, setCondition] = useState(searchParams.get('condition') || 'all')

    // Location & Radius
    const [radius, setRadius] = useState(searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50)
    const [lat, setLat] = useState<number | null>(searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null)
    const [lng, setLng] = useState<number | null>(searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null)

    const debouncedSearch = useDebounce(search, 500)

    useEffect(() => {
        const params = new URLSearchParams()

        if (debouncedSearch) params.set('q', debouncedSearch)
        if (type !== 'all') params.set('type', type)
        if (category !== 'all') params.set('category', category)
        if (condition !== 'all') params.set('condition', condition)

        // Location params
        if (lat && lng) {
            params.set('lat', lat.toString())
            params.set('lng', lng.toString())
            params.set('radius', radius.toString())
        }

        const query = params.toString()
        const url = `${pathname}${query ? `?${query}` : ''}`

        startTransition(() => {
            router.push(url)
        })
    }, [debouncedSearch, type, category, condition, radius, lat, lng, router, pathname])

    const handleLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLat(position.coords.latitude)
                setLng(position.coords.longitude)
            }, (error) => {
                console.error("Error getting location", error)
                alert("Standortzugriff fehlgeschlagen.")
            })
        } else {
            alert("Geolocation wird von diesem Browser nicht unterstützt.")
        }
    }

    const clearLocation = () => {
        setLat(null)
        setLng(null)
    }

    const handleSaveSearch = async () => {
        const filters = {
            type,
            category,
            condition,
            lat,
            lng,
            radius
        }

        const label = search ? `Suche: ${search}` : 'Aktive Filter'

        const res = await saveSearch(search, filters, label)
        if (res.success) {
            toast.success('Suche erfolgreich gespeichert! Wir benachrichtigen dich bei neuen Treffern.')
        } else {
            toast.error(res.error || 'Fehler beim Speichern')
        }
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Durchsuche alles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Angebotstyp" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Typen</SelectItem>
                        <SelectItem value="sell">Verkauf</SelectItem>
                        <SelectItem value="trade">Tausch</SelectItem>
                        <SelectItem value="rent">Verleih</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Zustand" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Beliebiger Zustand</SelectItem>
                        <SelectItem value="new">Neu & OVP</SelectItem>
                        <SelectItem value="like_new">Wie neu</SelectItem>
                        <SelectItem value="good">Gut</SelectItem>
                        <SelectItem value="acceptable">Akzeptabel</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center pt-2 border-t border-slate-100">
                <div className="flex items-center flex-1 gap-4">
                    <Button variant={lat ? "default" : "outline"} size="sm" onClick={handleLocation} className="gap-2">
                        <MapPin className="w-4 h-4" />
                        {lat ? "Mein Standort verwendet" : "In meiner Nähe suchen"}
                    </Button>
                    {lat && (
                        <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <span className="text-sm text-slate-500 whitespace-nowrap">Radius: {radius} km</span>
                            <Slider
                                value={[radius]}
                                onValueChange={(val) => setRadius(val[0])}
                                max={200}
                                step={5}
                                className="w-full"
                            />
                            <Button variant="ghost" size="icon" onClick={clearLocation} title="Standort löschen">
                                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                            </Button>
                        </div>
                    )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleSaveSearch} className="gap-2 text-slate-500 hover:text-primary">
                    <Bell className="w-4 h-4" />
                    Suche speichern
                </Button>
            </div>
        </div>
    )
}
