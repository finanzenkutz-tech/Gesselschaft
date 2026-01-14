'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, MapPin, Dice5, Tags, Star } from 'lucide-react'
import { updateProfile } from '@/app/profile/actions'
import { toast } from 'sonner'

const PLAY_STYLES = [
    "Schnellspieler",
    "Erklärbär",
    "Strategie-Fan",
    "Casual Gamer",
    "Social Deduction Pro",
    "Kompetitiv",
    "Kooperativ-Liebhaber",
    "Regel-Nazi",
    "Stimmungsmacher"
]

interface PersonalDetailsFormProps {
    initialBio?: string
    initialLocation?: string
    initialFavoriteGames?: string
    initialPlayStyleTags?: string[]
    initialShowReputation?: boolean
}

export function PersonalDetailsForm({
    initialBio = '',
    initialLocation = '',
    initialFavoriteGames = '',
    initialPlayStyleTags = [],
    initialShowReputation = false
}: PersonalDetailsFormProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>(initialPlayStyleTags || [])
    const [showReputation, setShowReputation] = useState(initialShowReputation)
    const [isSaving, setIsSaving] = useState(false)

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag))
        } else {
            setSelectedTags([...selectedTags, tag])
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true)
        try {
            // Append client-side managed state
            formData.append('play_style_tags', JSON.stringify(selectedTags))
            formData.append('show_reputation_present', 'true')
            if (showReputation) {
                formData.append('show_reputation', 'on')
            }

            // We can also just send the boolean value if we change the action to accept it directly,
            // but sticking to FormData/checkbox style for consistency with server action.

            const result = await updateProfile(formData)
            if (result.success) {
                toast.success('Profil aktualisiert')
            } else {
                toast.error('Fehler: ' + result.error)
            }
        } catch (error) {
            toast.error('Ein unerwarteter Fehler ist aufgetreten')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="sky-card p-8 space-y-8">
            <header>
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <User className="w-6 h-6 text-primary" />
                    Persönliche Infos
                </h3>
                <p className="text-slate-500 text-sm mt-1">Erzähl etwas über dich und deinen Spielstil.</p>
            </header>

            <form action={handleSubmit} className="space-y-6">

                {/* Bio */}
                <div className="space-y-2">
                    <Label htmlFor="bio">Über mich (Bio)</Label>
                    <Textarea
                        id="bio"
                        name="bio"
                        defaultValue={initialBio}
                        placeholder="Was spielst du gerne? Wie lange spielst du schon?"
                        className="rounded-xl bg-slate-50 border-slate-100 min-h-[100px]"
                    />
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="location">Wohnort</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input
                            id="location"
                            name="location"
                            defaultValue={initialLocation}
                            placeholder="z.B. Berlin, Kreuzberg"
                            className="pl-10 rounded-xl bg-slate-50 border-slate-100 h-12"
                        />
                    </div>
                </div>

                {/* Favorite Games */}
                <div className="space-y-2">
                    <Label htmlFor="favorite_games">Lieblingsspiele</Label>
                    <div className="relative">
                        <Dice5 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input
                            id="favorite_games"
                            name="favorite_games"
                            defaultValue={initialFavoriteGames}
                            placeholder="z.B. Terraforming Mars, Arche Nova, Codenames"
                            className="pl-10 rounded-xl bg-slate-50 border-slate-100 h-12"
                        />
                    </div>
                </div>

                {/* Play Styles */}
                <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                        <Tags className="w-4 h-4" />
                        Spielstil (Selbsteinschätzung)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {PLAY_STYLES.map(tag => (
                            <Badge
                                key={tag}
                                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                                className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105 ${selectedTags.includes(tag) ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50'}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <input type="hidden" name="play_style_tags_visual" value={selectedTags.join(',')} />
                </div>

                {/* Reputation Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                        <Label htmlFor="show_reputation" className="text-base font-bold text-slate-700 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Bewertungen anzeigen
                        </Label>
                        <p className="text-sm text-slate-500">Zeige erhaltene Bewertungen öffentlich auf deinem Profil an.</p>
                    </div>
                    <Switch
                        id="show_reputation"
                        checked={showReputation}
                        onCheckedChange={setShowReputation}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-blue-600 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-blue-200">
                        {isSaving ? 'Speichere...' : 'Speichern'}
                    </Button>
                </div>
            </form>
        </section>
    )
}
