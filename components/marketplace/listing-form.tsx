'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Image as ImageIcon, X, Store, Gift, Repeat, Euro, Save, Calendar } from 'lucide-react'
import { createListing, updateListing } from '@/app/(app)/marketplace/actions'
import confetti from 'canvas-confetti'

interface InventoryItem {
    id: string
    name: string
    image_url: string | null
    complexity: number | null
}

interface ListingData {
    id: string
    title: string
    description: string | null
    price: number | null
    condition: string | null
    listing_type: string
    location: string | null
    game_id: string | null
    images: string[] | null
    min_players?: number
    max_players?: number
    playtime?: number
    min_age?: number
    complexity?: number
    lat?: number | null
    lng?: number | null
}

import { MarketplaceLocationPicker } from '@/components/marketplace/location-picker'

interface ListingFormProps {
    inventory: InventoryItem[]
    initialData?: ListingData
}

export function ListingForm({ inventory, initialData }: ListingFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedGameId, setSelectedGameId] = useState<string>(initialData?.game_id || 'none')
    const [listingType, setListingType] = useState(initialData?.listing_type || 'sell')

    // Image handling
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    // Existing images (only for edit mode)
    const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || [])

    const [previews, setPreviews] = useState<string[]>([])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setSelectedFiles(prev => [...prev, ...newFiles])

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setPreviews(prev => [...prev, ...newPreviews])
        }
    }

    const removeNewFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index)
            // Cleanup URL object
            URL.revokeObjectURL(prev[index])
            return newPreviews
        })
    }

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleGameSelect = (value: string) => {
        setSelectedGameId(value)
    }

    async function onSubmit(formData: FormData) {
        setIsLoading(true)

        // Append all NEW images
        selectedFiles.forEach(file => {
            formData.append('new_images', file)
        })

        // Append remaining EXISTING images (so backend knows what to keep)
        // We can pass them as a JSON string or individual fields. Let's use individual fields for simplicity if array handling in server action expects it, 
        // or just a JSON string 'kept_images'
        formData.append('kept_images', JSON.stringify(existingImages))

        if (selectedGameId && selectedGameId !== 'none') {
            formData.set('game_id', selectedGameId)
        } else {
            formData.delete('game_id')
        }

        let res;
        if (initialData) {
            res = await updateListing(initialData.id, formData)
        } else {
            res = await createListing(formData)
        }

        if (res?.success) {
            if (!initialData) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })
            }
            router.push(initialData ? `/marketplace/${initialData.id}` : '/marketplace')
            router.refresh()
        } else {
            alert('Fehler: ' + res?.error)
            setIsLoading(false)
        }
    }

    // Calculate total images count for limit
    const totalImagesCount = existingImages.length + previews.length

    return (
        <form action={onSubmit} className="space-y-8">
            <div className="space-y-6">
                {/* Game Selection */}
                <div className="space-y-2">
                    <Label htmlFor="game_select" className="text-base font-bold">Spiel aus Sammlung wählen (Optional)</Label>
                    <Select name="game_select" value={selectedGameId} onValueChange={handleGameSelect}>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Wähle ein Spiel..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Kein Spiel verknüpfen</SelectItem>
                            {inventory.map(game => (
                                <SelectItem key={game.id} value={game.id}>
                                    {game.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400">Verknüpfe ein Spiel aus deiner Sammlung, um Daten automatisch zu übernehmen.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-base font-bold">Titel der Anzeige <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="z.B. Catan - Wie neu"
                            required
                            defaultValue={initialData?.title || (selectedGameId !== 'none' ? inventory.find(g => g.id === selectedGameId)?.name : '')}
                            className="font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="listing_type" className="text-base font-bold">Angebotstyp <span className="text-red-500">*</span></Label>
                        <Select name="listing_type" value={listingType} onValueChange={setListingType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sell">
                                    <div className="flex items-center gap-2"><Euro className="w-4 h-4 text-green-500" /> Verkaufen</div>
                                </SelectItem>
                                <SelectItem value="trade">
                                    <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-blue-500" /> Tauschen</div>
                                </SelectItem>
                                <SelectItem value="both">
                                    <div className="flex items-center gap-2"><Store className="w-4 h-4 text-purple-500" /> Beides</div>
                                </SelectItem>
                                <SelectItem value="rent">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" /> Verleihen</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {(listingType === 'sell' || listingType === 'both' || listingType === 'rent') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-base font-bold">{listingType === 'rent' ? 'Leihgebühr (€)' : 'Preis (€)'}</Label>
                            <div className="relative">
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.50"
                                    min="0"
                                    placeholder="0.00"
                                    required={listingType === 'sell' || listingType === 'rent'}
                                    defaultValue={initialData?.price || ''}
                                    className="pl-8 font-mono"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</div>
                            </div>
                        </div>

                        {listingType === 'rent' && (
                            <div className="space-y-2">
                                <Label htmlFor="rental_period_days" className="text-base font-bold">Standard Leihdauer (Tage)</Label>
                                <Input
                                    id="rental_period_days"
                                    name="rental_period_days"
                                    type="number"
                                    placeholder="z.B. 7"
                                    defaultValue={(initialData as any)?.rental_period_days || ''}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="condition" className="text-base font-bold">Zustand <span className="text-red-500">*</span></Label>
                        <Select name="condition" required defaultValue={initialData?.condition || "good"}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Neu & OVP</SelectItem>
                                <SelectItem value="like_new">Wie neu</SelectItem>
                                <SelectItem value="good">Gut</SelectItem>
                                <SelectItem value="acceptable">Akzeptabel</SelectItem>
                                <SelectItem value="poor">Stark gebraucht</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-base font-bold">Standort (Karte)</Label>
                        <MarketplaceLocationPicker
                            initialLat={initialData?.lat}
                            initialLng={initialData?.lng}
                            initialName={initialData?.location}
                            onLocationChange={(loc) => {
                                // Form data handled by hidden inputs in component and visible input 'location'
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-bold">Beschreibung</Label>
                    <Textarea
                        id="description"
                        name="description"
                        placeholder="Beschreibe den Zustand, fehlende Teile oder Besonderheiten..."
                        rows={5}
                        className="resize-none"
                        defaultValue={initialData?.description || ''}
                    />
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                        <Label htmlFor="min_players" className="text-xs font-bold uppercase text-slate-500">Min. Spieler</Label>
                        <Input type="number" name="min_players" min="1" placeholder="z.B. 2" defaultValue={initialData?.min_players || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="max_players" className="text-xs font-bold uppercase text-slate-500">Max. Spieler</Label>
                        <Input type="number" name="max_players" min="1" placeholder="z.B. 4" defaultValue={initialData?.max_players || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="playtime" className="text-xs font-bold uppercase text-slate-500">Dauer (Min)</Label>
                        <Input type="number" name="playtime" step="5" placeholder="z.B. 60" defaultValue={initialData?.playtime || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="min_age" className="text-xs font-bold uppercase text-slate-500">Alter (Jahre)</Label>
                        <Input type="number" name="min_age" min="0" placeholder="z.B. 10" defaultValue={initialData?.min_age || ''} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="complexity" className="text-xs font-bold uppercase text-slate-500">Komplexität (1-5)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="number" name="complexity" min="1" max="5" step="0.1" placeholder="z.B. 2.5" defaultValue={initialData?.complexity || ''} />
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                    <Label className="text-base font-bold">Bilder (max 5)</Label>

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {/* Existing Images */}
                        {existingImages.map((src, index) => (
                            <div key={`existing-${index}`} className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 group">
                                <img src={src} alt="Existing" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center p-0.5">Gespeichert</div>
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {/* New Previews */}
                        {previews.map((src, index) => (
                            <div key={`new-${index}`} className="aspect-square relative rounded-xl overflow-hidden border border-blue-200 group ring-2 ring-blue-100">
                                <img src={src} alt="New Preview" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] text-center p-0.5">Neu</div>
                                <button
                                    type="button"
                                    onClick={() => removeNewFile(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {totalImagesCount < 5 && (
                            <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors text-slate-400 hover:text-primary">
                                <ImageIcon className="w-6 h-6 mb-2" />
                                <span className="text-xs font-bold">Foto+</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Abbrechen</Button>
                <Button type="submit" disabled={isLoading} className="min-w-[150px]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : initialData ? <Save className="w-4 h-4 mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                    {initialData ? 'Speichern' : 'Anzeige erstellen'}
                </Button>
            </div>
        </form>
    )
}

