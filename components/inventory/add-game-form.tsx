'use client'

import { useState } from 'react'
import { BarcodeScannerDialog } from '@/components/inventory/barcode-scanner-dialog'
import { Dice5, Plus, Image, Search, Loader2, Link as LinkIcon, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Star } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { addGameToInventory } from '@/app/(app)/inventory/actions'
import { searchBGG, getBGGGameDetails, BGGSearchResult } from '@/app/(app)/inventory/bgg-actions'
import { searchKnownGames } from '@/app/(app)/inventory/actions'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useEffect } from 'react'
import { searchSpielerliste } from '@/app/(app)/inventory/actions'
import type { GameEntry } from '@/lib/spieleliste'

type Group = { id: string; name: string }

export function AddGameForm({ groups }: { groups: Group[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // BGG Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<(BGGSearchResult & { source?: string; original?: any })[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedBggId, setSelectedBggId] = useState<string | null>(null)
    const [selectedSource, setSelectedSource] = useState<string | null>(null)

    // Form State (for auto-fill)
    const [gameName, setGameName] = useState('')
    const [bggLink, setBggLink] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [isUnplayed, setIsUnplayed] = useState(false)
    const [complexity, setComplexity] = useState(3)
    // New Metadata State
    const [minPlayers, setMinPlayers] = useState<number | null>(null)
    const [maxPlayers, setMaxPlayers] = useState<number | null>(null)
    const [playtime, setPlaytime] = useState<number | null>(null)
    const [strategy, setStrategy] = useState<number | null>(null)
    const [luck, setLuck] = useState<number | null>(null)
    const [category, setCategory] = useState<string | null>(null)
    const [priceNew, setPriceNew] = useState<string>('')
    const [priceUsed, setPriceUsed] = useState<string>('')

    const router = useRouter()

    function handleScan(decodedText: string) {
        setSearchQuery(decodedText)
        handleSearch(decodedText)
        toast.info(`Suche nach Code/Spiel: ${decodedText}`)
    }

    const debouncedSearch = useDebounce(searchQuery, 500)

    useEffect(() => {
        if (debouncedSearch && debouncedSearch.length >= 3) {
            handleSearch(debouncedSearch)
        } else {
            setSearchResults([])
        }
    }, [debouncedSearch])

    async function handleSearch(query: string) {
        setSearching(true)

        // 1. Search Local SPIELELISTE (Top 200) - now on server
        const listMatches = await searchSpielerliste(query)

        // 2. Search Known Games (Database)
        const localResults = await searchKnownGames(query)
        const mappedLocal = localResults.map((g: any) => ({
            id: g.bgg_id,
            name: g.name,
            yearpublished: g.year_published,
            source: 'known',
            original: g
        }))

        // 3. Search BGG (Fallback/Complementary)
        // Merge results, prioritizing list and database
        let finalResults: any[] = [...listMatches, ...mappedLocal]

        if (localResults.length < 5) {
            try {
                const bggResults = await searchBGG(query)
                // Filter duplicates
                const localIds = new Set(mappedLocal.map((x: any) => x.id))
                const listIds = new Set(listMatches.map((x: any) => x.id))
                const newBgg = bggResults.filter(x => !localIds.has(x.id) && !listIds.has(x.id)).map(x => ({ ...x, source: 'bgg' }))
                finalResults = [...finalResults, ...newBgg]
            } catch (err) {
                console.warn('BGG Search failed, showing local only')
            }
        }

        setSearchResults(finalResults as any)
        setSearching(false)
    }

    async function handleSelectGame(game: any) {
        setSelectedBggId(game.id)
        setGameName(game.name)
        setSelectedSource(game.source || 'manual')
        setBggLink(`https://boardgamegeek.com/boardgame/${game.id}`)

        setSearching(true)

        if (game.source === 'list' && game.original) {
            // Use local list data
            const entry = game.original as GameEntry
            setComplexity(entry.complexity || 3)
            setCategory(entry.category || null)

            // Parse players (e.g., "2–4" or "2")
            const playerParts = entry.players.split(/[–-]/)
            if (playerParts.length === 2) {
                setMinPlayers(parseInt(playerParts[0]))
                setMaxPlayers(parseInt(playerParts[1]))
            } else {
                setMinPlayers(parseInt(playerParts[0]))
                setMaxPlayers(parseInt(playerParts[0]))
            }

            // Parse playtime (e.g., "60–120" or "60")
            const timeParts = entry.duration.split(/[–-]/)
            if (timeParts.length === 2) {
                setPlaytime(parseInt(timeParts[1]))
            } else {
                setPlaytime(parseInt(timeParts[0]))
            }

            setBggLink('') // Clear link as we don't have it in the list
            setImageUrl('')
            setStrategy(null)
            setLuck(null)

        } else if (game.source === 'known' && game.original) {
            // Use local database details
            const details = game.original
            setImageUrl(details.image_url || '')
            setComplexity(details.complexity || 3)
            setMinPlayers(details.min_players || null)
            setMaxPlayers(details.max_players || null)
            setPlaytime(details.playtime_max || null)
            setStrategy(details.strategy_score || null)
            setLuck(details.luck_score || null)
            setCategory(details.category || null)
            setBggLink(`https://boardgamegeek.com/boardgame/${game.id}`)
        } else {
            // Fetch from BGG
            const details = await getBGGGameDetails(game.id)
            if (details) {
                if (details.image || details.thumbnail) {
                    setImageUrl(details.image || details.thumbnail || '')
                }
                if (details.complexity) setComplexity(details.complexity)
                // if (details.rating) setStrategy(details.rating)
                // details.complexity is 'weight'.
                setMinPlayers(details.minplayers || null)
                setMaxPlayers(details.maxplayers || null)
                setPlaytime(details.playingtime || null)
                setCategory(details.categories?.[0] || null)
                setBggLink(`https://boardgamegeek.com/boardgame/${game.id}`)
            }
        }

        setSearching(false)
        setSearchResults([])
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        // Ensure state values are in formData
        if (gameName) formData.set('name', gameName)
        if (bggLink) formData.set('bgg_link', bggLink)
        if (imageUrl) formData.set('image_url_remote', imageUrl) // New field for remote images
        if (category) formData.set('category', category)
        formData.set('is_unplayed', isUnplayed.toString())
        formData.set('complexity', complexity.toString())
        if (minPlayers) formData.set('min_players', minPlayers.toString())
        if (maxPlayers) formData.set('max_players', maxPlayers.toString())
        if (playtime) formData.set('playtime', playtime.toString())
        if (strategy) formData.set('strategy_score', strategy.toString())
        if (luck) formData.set('luck_score', luck.toString())
        if (priceNew) formData.set('price_new', priceNew)
        if (priceUsed) formData.set('price_used', priceUsed)
        if (selectedSource) formData.set('source', selectedSource)

        const result = await addGameToInventory(formData)

        setLoading(false)

        if (result.success) {
            setOpen(false)
            resetForm()

            // Fire confetti! 🎲🎉
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
            })

            // Show insights if available
            if (result.insights && result.insights.length > 0) {
                result.insights.forEach((insight: string, index: number) => {
                    setTimeout(() => {
                        toast.success(insight, {
                            duration: 6000,
                            icon: index === 0 ? '✨' : index === 1 ? '💎' : '💰'
                        })
                    }, index * 1000)
                })
            } else {
                toast.success("Spiel zur Sammlung hinzugefügt!")
            }

            router.refresh()
        } else {
            setError(result.error || 'Spiel konnte nicht hinzugefügt werden')
        }
    }

    function resetForm() {
        setSearchQuery('')
        setSearchResults([])
        setGameName('')
        setBggLink('')
        setImageUrl('')
        setSelectedBggId(null)
        setIsUnplayed(false)
        setComplexity(3)
        setMinPlayers(null)
        setMaxPlayers(null)
        setPlaytime(null)
        setStrategy(null)
        setLuck(null)
        setPriceNew('')
        setPriceUsed('')
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-blue-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-blue-200">
                    <Plus className="w-5 h-5 mr-2" /> Spiel hinzufügen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Dice5 className="w-8 h-8" /> Spiel hinzufügen
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        Suche auf BoardGameGeek oder trage es manuell ein.
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    {/* BGG Search Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 ml-1">Spiel finden</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                    placeholder="Spielname suchen..."
                                    className="pl-10 rounded-xl bg-slate-50 border-slate-100 h-12"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleSearch(searchQuery)}
                                disabled={searching || searchQuery.length < 3}
                                className="rounded-xl h-12 px-4 whitespace-nowrap"
                            >
                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suchen'}
                            </Button>
                        </div>

                        {(searchResults.length > 0 || (searchQuery.length >= 3 && !searching)) && (
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto mt-2 shadow-inner">
                                {searchResults.length > 0 ? (
                                    searchResults.map((game) => (
                                        <button
                                            key={game.id}
                                            type="button"
                                            onClick={() => handleSelectGame(game)}
                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0 group transition-colors"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-slate-700 group-hover:text-primary">{game.name}</p>
                                                <p className="text-xs text-slate-400">{game.yearpublished || 'Jahr unbekannt'}</p>
                                            </div>
                                            {selectedBggId === game.id && <Check className="w-4 h-4 text-green-500" />}
                                        </button>
                                    ))
                                ) : searchQuery.length >= 3 && !searching && (
                                    <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                        Keine Ergebnisse auf BGG gefunden.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Oder manuell</span>
                        </div>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Game Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Name des Spiels *</label>
                                <Input
                                    name="name"
                                    value={gameName}
                                    onChange={(e) => setGameName(e.target.value)}
                                    placeholder="z.B. Terraforming Mars"
                                    required
                                    className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                />
                            </div>

                            {/* Pile of Shame Toggle (Moved Here) */}
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-red-900">Noch ungespielt? (Pile of Shame)</label>
                                    <p className="text-xs text-red-600">Markiere dies, wenn es noch auf den Tisch kommen muss.</p>
                                </div>
                                <Switch
                                    name="is_unplayed"
                                    checked={isUnplayed}
                                    onCheckedChange={setIsUnplayed}
                                    className="data-[state=checked]:bg-red-500"
                                />
                            </div>

                            {/* Hidden Inputs for BGG Data */}
                            <input type="hidden" name="bgg_link" value={bggLink} />
                            {/* ... other hidden fields if needed, but handled by state binding in handleSubmit essentially */}

                            {/* Image Preview / URL */}
                            {imageUrl && (
                                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-blue-100 shrink-0">
                                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-blue-600 truncate">BGG Bild geladen</p>
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase transition-colors"
                                        >
                                            Entfernen
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Image Upload */}
                            {!imageUrl && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Image className="w-4 h-4" /> Eigenes Bild (optional)
                                    </label>
                                    <Input name="image" type="file" accept="image/*" className="rounded-xl bg-slate-50 border-slate-100 h-12 pt-2.5 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-blue-600" />
                                </div>
                            )}

                            {/* Visibility */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Sichtbarkeit</label>
                                <select
                                    name="visibility"
                                    defaultValue="groups"
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white text-sm outline-none"
                                >
                                    <option value="private">🔒 Nur für mich</option>
                                    <option value="profile">👤 Alle, die mein Profil sehen</option>
                                    <option value="groups">👥 Alle in meinen Gruppen</option>
                                    <option value="buddies">🤝 Meine Buddies</option>
                                </select>
                            </div>

                            {/* Group Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Bestimmte Gruppe (optional)</label>
                                <select name="group_id" className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white text-sm outline-none">
                                    <option value="">Keine bestimmte Gruppe</option>
                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>

                            {/* Category Rating */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Kategorie</label>
                                <Input
                                    name="category"
                                    value={category || ''}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="z.B. Strategie, Familienspiel, Party..."
                                    className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                />
                            </div>

                            {/* Complexity Rating */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500" /> Komplexität (1-5)
                                </label>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="0.5"
                                        value={complexity}
                                        onChange={(e) => setComplexity(parseFloat(e.target.value))}
                                        className="flex-1 accent-primary"
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-primary shadow-sm">
                                        {complexity.toFixed(1)}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 ml-1">
                                    1 = Sehr einfach (z.B. Uno), 5 = Sehr komplex (z.B. Gaia Project)
                                </p>
                            </div>

                            {/* Price Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Neupreis (€)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="price_new"
                                        value={priceNew}
                                        onChange={(e) => setPriceNew(e.target.value)}
                                        placeholder="0.00"
                                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Gebrauchtwert (€)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="price_used"
                                        value={priceUsed}
                                        onChange={(e) => setPriceUsed(e.target.value)}
                                        placeholder="0.00"
                                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || searching}
                            className="w-full bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                        </Button>
                    </form>
                </div>
            </DialogContent >
        </Dialog >
    )
}

