'use client'

import { useState } from 'react'
import { Dice5, Plus, Image, Search, Loader2, Link as LinkIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { addGameToInventory } from '@/app/inventory/actions'
import { searchBGG, getBGGGameDetails, BGGSearchResult } from '@/app/inventory/bgg-actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

type Group = { id: string; name: string }

export function AddGameForm({ groups }: { groups: Group[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // BGG Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedBggId, setSelectedBggId] = useState<string | null>(null)

    // Form State (for auto-fill)
    const [gameName, setGameName] = useState('')
    const [bggLink, setBggLink] = useState('')
    const [imageUrl, setImageUrl] = useState('')

    const router = useRouter()

    async function handleSearch() {
        if (searchQuery.length < 3) return
        setSearching(true)
        const results = await searchBGG(searchQuery)
        setSearchResults(results)
        setSearching(false)
    }

    async function handleSelectGame(game: BGGSearchResult) {
        setSelectedBggId(game.id)
        setGameName(game.name)
        setBggLink(`https://boardgamegeek.com/boardgame/${game.id}`)

        // Fetch full details to get the image
        setSearching(true)
        const details = await getBGGGameDetails(game.id)
        if (details?.image || details?.thumbnail) {
            setImageUrl(details.image || details.thumbnail || '')
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

        const result = await addGameToInventory(formData)

        setLoading(false)

        if (result.success) {
            setOpen(false)
            resetForm()

            // Fire confetti! 🎲🎉
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
            })

            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                })
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                })
            }, 200)

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
                        <label className="text-sm font-bold text-slate-700 ml-1">BoardGameGeek Suche</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Spielname suchen..."
                                    className="pl-10 rounded-xl bg-slate-50 border-slate-100 h-12"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleSearch}
                                disabled={searching || searchQuery.length < 3}
                                className="rounded-xl h-12 px-4 whitespace-nowrap"
                            >
                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suchen'}
                            </Button>
                        </div>

                        {searchResults.length > 0 && (
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

                            {/* BGG Link */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" /> BGG Link
                                </label>
                                <Input
                                    name="bgg_link"
                                    value={bggLink}
                                    onChange={(e) => setBggLink(e.target.value)}
                                    placeholder="https://boardgamegeek.com/..."
                                    className="rounded-xl bg-slate-50 border-slate-100 h-12"
                                />
                            </div>

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
                                <select name="visibility" className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white text-sm outline-none">
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
            </DialogContent>
        </Dialog>
    )
}
