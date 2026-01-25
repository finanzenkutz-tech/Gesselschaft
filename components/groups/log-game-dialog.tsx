'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trophy, Users, Calendar, Dice5, Check, Search, MapPin, Star, Zap, Clock3, Loader2, Camera, Image as ImageIcon, Flame } from 'lucide-react'
import { logGameSession, uploadSessionImage } from '@/app/groups/game-actions'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { AddPlaceDialog } from '@/components/groups/add-place-dialog'
import { searchBGGGames, getBGGGameDetails } from '@/app/groups/bgg-actions'
import confetti from 'canvas-confetti'

interface LogGameDialogProps {
    groupId: string
    games: any[]
    members: any[]
    places: any[]
    trigger?: React.ReactNode
    defaultEventId?: string
    currentUserId?: string
}

export function LogGameDialog({ groupId, games, members, places, trigger, defaultEventId, currentUserId }: LogGameDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [bggLoading, setBggLoading] = useState(false)
    const router = useRouter()

    const [gameName, setGameName] = useState('')
    const [bggResults, setBggResults] = useState<any[]>([])
    const [selectedGameImage, setSelectedGameImage] = useState<string | undefined>(undefined)
    const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 16))
    const [location, setLocation] = useState('')
    const [scores, setScores] = useState<Record<string, number>>({})
    const [placements, setPlacements] = useState<Record<string, number>>({})
    const [brings, setBrings] = useState<Record<string, string>>({})
    const [punctuality, setPunctuality] = useState<Record<string, boolean>>({})
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
    const [winnerId, setWinnerId] = useState<string | undefined>(undefined)
    const [comment, setComment] = useState('')
    const [isLocationFocused, setIsLocationFocused] = useState(false)

    // New rating states
    const [rating, setRating] = useState(0)
    const [complexityRating, setComplexityRating] = useState(0) // 1-5
    const [durationRating, setDurationRating] = useState(0) // 1-5 (Short-Long)

    // Extended session info
    const [durationActual, setDurationActual] = useState('') // minutes
    const [mood, setMood] = useState('') // emoji or text
    const [isEpic, setIsEpic] = useState(false)
    const [sessionImageUrl, setSessionImageUrl] = useState<string | undefined>(undefined)
    const [uploadingImage, setUploadingImage] = useState(false)

    const analyzeVictory = (currentScores: Record<string, number>, currentWinnerId?: string) => {
        if (!currentWinnerId || Object.keys(currentScores).length < 2) return null

        const scoresArr = Object.values(currentScores).sort((a, b) => b - a)
        if (scoresArr.length < 2) return null

        const first = scoresArr[0]
        const second = scoresArr[1]

        if (first <= 0) return null

        const diff = first - second
        const percent = (diff / first) * 100

        if (percent >= 50) return { type: 'Dominiert', message: 'Wahnsinn! Du hast die Gruppe absolut dominiert! 👑' }
        if (percent >= 20) return { type: 'Klarer Sieg', message: 'Ein klarer und verdienter Sieg! Gut gespielt! 🏆' }
        if (percent <= 10) return { type: 'Knappe Kiste', message: 'Puh, das war eine knappe Kiste! Haarscharf gewonnen! 🎢' }
        return { type: 'Sieg', message: 'Herzlichen Glückwunsch zum Sieg! 🎉' }
    }

    // Filtered lists
    const filteredGames = gameName ? games.filter(g =>
        g.name.toLowerCase().includes(gameName.toLowerCase())
    ) : []

    const filteredPlaces = location ? places.filter(p =>
        p.name.toLowerCase().includes(location.toLowerCase())
    ) : places

    const togglePlayer = (userId: string) => {
        if (selectedPlayers.includes(userId)) {
            setSelectedPlayers(prev => prev.filter(id => id !== userId))
            if (winnerId === userId) {
                setWinnerId(undefined)
                // Remove placement 1 if was winner
                const newPlacements = { ...placements }
                delete newPlacements[userId]
                setPlacements(newPlacements)
            }
        } else {
            setSelectedPlayers(prev => [...prev, userId])
        }
    }

    const handleBGGSearch = async (val: string) => {
        setGameName(val)
        if (val.length >= 3) {
            setBggLoading(true)
            const results = await searchBGGGames(val)
            setBggResults(results)
            setBggLoading(false)
        } else {
            setBggResults([])
        }
    }

    const handleSelectGame = (game: any) => {
        setGameName(game.name)
        setSelectedGameImage(game.image_url || undefined)
        setBggResults([])
    }

    const handleSelectBGGGame = async (bggId: string) => {
        setBggLoading(true)
        const details = await getBGGGameDetails(bggId)
        if (details) {
            setGameName(details.name)
            setSelectedGameImage(details.imageUrl)
            // Auto fill ratings if available from BGG? Maybe not, user should rate.
        }
        setBggResults([])
        setBggLoading(false)
    }

    const handleSelectPlace = (placeName: string) => {
        setLocation(placeName)
        setIsLocationFocused(false)
    }

    const handleScoreChange = (userId: string, scoreStr: string) => {
        const score = parseInt(scoreStr)
        if (!isNaN(score)) {
            setScores(prev => ({ ...prev, [userId]: score }))
        } else {
            const newScores = { ...scores }
            delete newScores[userId]
            setScores(newScores)
        }
    }

    const handleBringsChange = (userId: string, text: string) => {
        setBrings(prev => ({ ...prev, [userId]: text }))
    }

    const togglePunctual = (userId: string) => {
        setPunctuality(prev => ({
            ...prev,
            [userId]: !(prev[userId] ?? true)
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await uploadSessionImage(formData)
            if (res.success && res.url) {
                setSessionImageUrl(res.url)
                toast.success("Foto hochgeladen!")
            } else {
                toast.error("Fehler beim Upload: " + res.error)
            }
        } catch (err) {
            console.error(err)
            toast.error("Fehler beim Upload")
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSubmit = async () => {
        if (!gameName.trim()) return toast.error("Bitte gib einen Spielnamen ein")
        if (selectedPlayers.length === 0) return toast.error("Wer hat mitgespielt?")

        setLoading(true)
        try {
            await logGameSession({
                groupId,
                gameName,
                gameImageUrl: selectedGameImage,
                playedAt: new Date(playedAt).toISOString(),
                playerIds: selectedPlayers,
                winnerId: winnerId,
                scores: scores,
                placements: placements,
                location: location.trim() || undefined,
                comment: comment.trim() || undefined,
                rating,
                complexityRating,
                durationRating,
                durationActual: parseInt(durationActual) || undefined,
                mood,
                brings: brings,
                punctuality: punctuality,
                isEpic,
                reportImageUrl: sessionImageUrl,
                eventId: defaultEventId
            })

            const victoryInfo = winnerId === currentUserId ? analyzeVictory(scores, winnerId) : null

            if (victoryInfo) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#fbbf24', '#10b981']
                })
                toast.success(victoryInfo.message, {
                    duration: 5000,
                })
            } else if (winnerId) {
                const winner = members.find(m => m.user_id === winnerId)
                toast.success(`Spiel eingetragen! Gratulation an ${winner?.profiles?.full_name || 'den Gewinner'}!`)
            } else {
                toast.success("Spiel eingetragen!")
            }

            setOpen(false)
            router.refresh()
            toast.success("Spiel eingetragen!")

            // Reset form
            setGameName('')
            setSelectedGameImage(undefined)
            setSelectedPlayers([])
            setWinnerId(undefined)
            setScores({})
            setPlacements({})
            setLocation('')
            setBrings({})
            setPunctuality({})
            setRating(0)
            setComplexityRating(0)
            setDurationRating(0)
            setComment('')
            setIsEpic(false)
            setSessionImageUrl(undefined)
        } catch (error) {
            toast.error("Fehler beim Speichern")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700 hover:text-primary hover:border-primary/50 font-bold px-6 shadow-sm transition-all hover:shadow-md group/trigger">
                        <Dice5 className="w-5 h-5 mr-2 group-hover/trigger:rotate-12 transition-transform" />
                        Spiel nachtragen
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden gap-0">
                <div className="bg-gradient-to-br from-primary/10 via-white to-secondary/5 p-8 border-b border-white/40">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Dice5 className="w-7 h-7" />
                            </div>
                            Spiel loggen
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                            Halte eure Spielerlebnisse für die Ewigkeit (und die Bestenliste) fest.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Game Selection */}
                    <div className="space-y-3 relative group">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Welches Spiel?</Label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Suche in der Sammlung oder BGG..."
                                value={gameName}
                                onChange={(e) => handleBGGSearch(e.target.value)}
                                className="pl-12 h-14 bg-white/50 border-slate-100 rounded-2xl text-lg font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                            />
                            {bggLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />}
                        </div>

                        {(gameName && (filteredGames.length > 0 || bggResults.length > 0)) && (
                            <div className="absolute z-[60] w-full bg-white/95 backdrop-blur-md border border-white shadow-2xl rounded-3xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto">
                                {filteredGames.length > 0 && (
                                    <div className="px-4 py-2 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Aus deiner Sammlung</div>
                                )}
                                {filteredGames.slice(0, 5).map(game => (
                                    <button
                                        key={game.id}
                                        onClick={() => handleSelectGame(game)}
                                        className="w-full text-left px-6 py-4 hover:bg-primary/5 text-slate-700 transition-colors flex items-center gap-4 group/item"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                            {game.image_url ? (
                                                <img src={game.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Dice5 className="w-full h-full p-3 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 group-hover/item:text-primary transition-colors">{game.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{game.min_players}-{game.max_players} Spieler • {game.playtime} Min</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    </button>
                                ))}

                                {bggResults.length > 0 && (
                                    <div className="px-4 py-2 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">BoardGameGeek Ergebnisse</div>
                                )}
                                {bggResults.map(game => (
                                    <button
                                        key={game.bggId}
                                        onClick={() => handleSelectBGGGame(game.bggId)}
                                        className="w-full text-left px-6 py-4 hover:bg-primary/5 text-slate-700 transition-colors flex items-center gap-4 group/item"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-primary">
                                            <Dice5 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 group-hover/item:text-primary transition-colors">{game.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">Veröffentlicht: {game.yearPublished}</p>
                                        </div>
                                        <Search className="w-4 h-4 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ratings Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500 delay-150">
                        {/* Star Rating - CENTERED & LARGE */}
                        <div className="md:col-span-3 bg-white/50 border border-slate-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 shadow-sm">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Gesamtbewertung</Label>
                            <div className="flex items-center gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-all active:scale-90 hover:scale-125"
                                    >
                                        <Star
                                            className={cn(
                                                "w-10 h-10 transition-all duration-300",
                                                star <= rating
                                                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)] rotate-0"
                                                    : "text-slate-200 fill-slate-100 rotate-12"
                                            )}
                                            strokeWidth={star <= rating ? 0 : 1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Complexity */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Anspruch (1-5)</Label>
                            <div className="flex items-center gap-2 bg-white/50 border border-slate-100 rounded-2xl p-3 h-14 justify-center">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setComplexityRating(level)}
                                        className="transition-transform active:scale-90"
                                    >
                                        <Zap
                                            className={cn(
                                                "w-5 h-5 transition-colors",
                                                level <= complexityRating ? "fill-purple-500 text-purple-500" : "text-slate-200"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration (Categorical) */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Gefühlte Dauer</Label>
                            <div className="flex items-center gap-2 bg-white/50 border border-slate-100 rounded-2xl p-3 h-14 justify-center">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDurationRating(level)}
                                        className="transition-transform active:scale-90"
                                    >
                                        <Clock3
                                            className={cn(
                                                "w-5 h-5 transition-colors",
                                                level <= durationRating ? "fill-blue-500 text-blue-500" : "text-slate-200"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* New: Actual Duration & Mood */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                                <Clock3 className="w-3 h-3" /> Echtzeit (Minuten)
                            </Label>
                            <Input
                                type="number"
                                placeholder="z.B. 120"
                                value={durationActual}
                                onChange={(e) => setDurationActual(e.target.value)}
                                className="h-14 bg-white border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                                <Star className="w-3 h-3" /> Stimmung
                            </Label>
                            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2 h-14">
                                {['🥳', '🙂', '😐', '😣', '🤬'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMood(m)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl transition-all flex items-center justify-center text-xl",
                                            mood === m ? "bg-primary/10 scale-110 shadow-inner" : "hover:bg-slate-50 opacity-50 hover:opacity-100"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Wann?</Label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <Input
                                    type="datetime-local"
                                    value={playedAt}
                                    onChange={(e) => setPlayedAt(e.target.value)}
                                    className="pl-12 h-14 bg-white/50 border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        {/* Location */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Wo wurde gespielt?</Label>
                            <div className="relative group/location">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <Input
                                            placeholder="Ort wählen..."
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            onFocus={() => setIsLocationFocused(true)}
                                            onBlur={() => setTimeout(() => setIsLocationFocused(false), 200)}
                                            className="pl-12 h-14 bg-white/50 border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                        />
                                    </div>
                                    <AddPlaceDialog
                                        groupId={groupId}
                                        trigger={
                                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 bg-white/50 hover:bg-white hover:text-primary shrink-0 transition-all shadow-sm">
                                                <Plus className="w-6 h-6" />
                                            </Button>
                                        }
                                        onSuccess={() => router.refresh()}
                                    />
                                </div>
                                {(isLocationFocused || location) && filteredPlaces.length > 0 && !places.find(p => p.name === location) && (
                                    <div className="absolute z-[60] w-full bg-white/95 backdrop-blur-md border border-white shadow-2xl rounded-3xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                                        {filteredPlaces.map(place => (
                                            <button
                                                key={place.id}
                                                onClick={() => handleSelectPlace(place.name)}
                                                className="w-full text-left px-6 py-4 hover:bg-primary/5 text-slate-700 transition-colors flex items-center gap-4 group/item"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <MapPin className="w-5 h-5 text-slate-300 group-hover/item:text-primary transition-colors" />
                                                </div>
                                                <span className="font-bold">{place.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Epic & Image */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Epic Round Toggle */}
                        <div
                            onClick={() => setIsEpic(!isEpic)}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group/epic",
                                isEpic ? "border-amber-400 bg-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.3)]" : "border-slate-100 bg-white hover:border-slate-200"
                            )}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                isEpic ? "bg-amber-400 text-white rotate-12 scale-110" : "bg-slate-50 text-slate-300"
                            )}>
                                <Flame className={cn("w-8 h-8", isEpic && "animate-pulse")} />
                            </div>
                            <div className="flex-1 z-10">
                                <p className={cn("font-black text-lg", isEpic ? "text-amber-600" : "text-slate-400")}>Epische Runde</p>
                                <p className="text-xs font-medium text-slate-400">War das Spiel legendär?</p>
                            </div>
                            {isEpic && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-300/20 rounded-full blur-2xl" />}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Beweisfoto (Optional)</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="session-image-upload"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />
                                <Label
                                    htmlFor="session-image-upload"
                                    className={cn(
                                        "flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer h-20",
                                        sessionImageUrl ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-primary/50"
                                    )}
                                >
                                    {uploadingImage ? (
                                        <div className="w-full flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                                    ) : sessionImageUrl ? (
                                        <>
                                            <div className="w-12 h-12 rounded-lg bg-cover bg-center border border-white shadow-sm" style={{ backgroundImage: `url(${sessionImageUrl})` }} />
                                            <div className="flex-1">
                                                <p className="font-bold text-green-700 text-sm">Foto hinzugefügt!</p>
                                                <p className="text-xs text-green-500">Klicken zum Ändern</p>
                                            </div>
                                            <Check className="text-green-500 w-5 h-5 mr-2" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-300 border border-slate-100">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-600 text-sm">Foto hochladen</p>
                                                <p className="text-xs text-slate-400">Vom Tisch oder Ergebnis</p>
                                            </div>
                                        </>
                                    )}
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Kommentar / Notizen</Label>
                        <Textarea
                            placeholder="Wie war die Stimmung? Gab es epische Momente?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-white/50 border-slate-100 rounded-2xl font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-sm min-h-[100px]"
                        />
                    </div>

                    {/* Players */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Teilnehmer ({selectedPlayers.length})</Label>
                            <span className="text-[10px] text-slate-300 font-bold">Klicke zum Auswählen</span>
                        </div>
                        <ScrollArea className="h-96 rounded-[1.5rem] border border-slate-100 p-4 bg-slate-50/30">
                            <div className="flex flex-col gap-3">
                                {members.map((member: any) => {
                                    const isSelected = selectedPlayers.includes(member.user_id)
                                    const isWinner = winnerId === member.user_id

                                    return (
                                        <div
                                            key={member.user_id}
                                            className={cn(
                                                "rounded-2xl transition-all duration-300 border overflow-hidden group/player",
                                                isSelected
                                                    ? "bg-white border-primary/20 shadow-lg shadow-primary/5"
                                                    : "bg-white/40 border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-md"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-center gap-4 p-4 cursor-pointer",
                                                    isSelected ? "bg-primary/5" : ""
                                                )}
                                                onClick={() => togglePlayer(member.user_id)}
                                            >
                                                <div className="relative">
                                                    <Avatar className={cn(
                                                        "w-12 h-12 transition-transform",
                                                        isSelected ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
                                                    )}>
                                                        <AvatarImage src={member.profiles?.avatar_url} />
                                                        <AvatarFallback className="bg-slate-100 font-bold text-slate-500">
                                                            {member.profiles?.full_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {isWinner && (
                                                        <div className="absolute -top-2 -right-2 bg-amber-400 text-white rounded-full p-1 shadow-lg animate-bounce">
                                                            <Trophy className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "font-extrabold truncate text-lg transition-colors",
                                                        isSelected ? "text-primary" : "text-slate-700"
                                                    )}>
                                                        {member.profiles?.full_name}
                                                    </p>
                                                    {isSelected && (
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] font-black uppercase text-slate-400">Aktiv</span>
                                                            {scores[member.user_id] !== undefined && (
                                                                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-1.5 rounded-full">{scores[member.user_id]} Pkt</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                    isSelected ? "bg-primary border-primary text-white" : "border-slate-200 text-transparent group-hover/player:border-slate-300"
                                                )}>
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="p-6 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100/50 animate-in slide-in-from-top-4 duration-500">
                                                    {/* Score & Winner */}
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ergebnis & Sieg</Label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="h-12 text-center text-lg font-black bg-white focus:ring-primary/10"
                                                                    value={scores[member.user_id] ?? ''}
                                                                    onChange={(e) => handleScoreChange(member.user_id, e.target.value)}
                                                                />
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Pkt</div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const isNewWinner = winnerId !== member.user_id
                                                                    setWinnerId(isNewWinner ? member.user_id : undefined)

                                                                    // Auto-set placement to 1 if winner
                                                                    if (isNewWinner) {
                                                                        setPlacements(prev => ({ ...prev, [member.user_id]: 1 }))
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "h-12 w-12 flex items-center justify-center rounded-xl border transition-all font-bold text-sm",
                                                                    isWinner
                                                                        ? "bg-amber-100 text-amber-600 border-amber-200 shadow-lg shadow-amber-200/20 scale-105"
                                                                        : "bg-white text-slate-300 border-slate-200 hover:border-amber-300 hover:text-amber-500"
                                                                )}
                                                            >
                                                                <Trophy className={cn("w-5 h-5", isWinner ? "fill-amber-500" : "")} />
                                                            </button>

                                                            <div className="relative w-20">
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={selectedPlayers.length}
                                                                    placeholder="#"
                                                                    className={cn(
                                                                        "h-12 text-center text-lg font-black bg-white focus:ring-primary/10",
                                                                        placements[member.user_id] === 1 ? "text-amber-500 border-amber-200 bg-amber-50" :
                                                                            placements[member.user_id] === 2 ? "text-slate-500 border-slate-300" :
                                                                                placements[member.user_id] === 3 ? "text-orange-700 border-orange-200" : ""
                                                                    )}
                                                                    value={placements[member.user_id] ?? ''}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value)
                                                                        if (val > 0) {
                                                                            setPlacements(prev => ({ ...prev, [member.user_id]: val }))
                                                                            // If user sets 1 but is not winner, maybe set winner? 
                                                                            // Let's keep it manual for flexibility, but maybe clear winner if not 1
                                                                            if (val === 1 && winnerId !== member.user_id) setWinnerId(member.user_id)
                                                                        } else {
                                                                            const newP = { ...placements }
                                                                            delete newP[member.user_id]
                                                                            setPlacements(newP)
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="absolute top-0 right-1 text-[8px] text-slate-400 font-bold leading-none mt-1 mr-1">RANG</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistik & Details</Label>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => togglePunctual(member.user_id)}
                                                                className={cn(
                                                                    "h-12 px-4 rounded-xl border transition-all text-xs font-black uppercase tracking-widest leading-none",
                                                                    (punctuality[member.user_id] ?? true)
                                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                        : "bg-red-50 text-red-600 border-red-100"
                                                                )}
                                                            >
                                                                {(punctuality[member.user_id] ?? true) ? "Pünktlich" : "Verspätet"}
                                                            </button>
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    placeholder="Was brachte er mit?"
                                                                    className="h-12 bg-white text-sm font-medium focus:ring-primary/10 pl-10"
                                                                    value={brings[member.user_id] ?? ''}
                                                                    onChange={(e) => handleBringsChange(member.user_id, e.target.value)}
                                                                />
                                                                <Dice5 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <div className="p-8 bg-slate-50/80 border-t border-slate-100">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-[1.25rem] h-16 text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                Wird gespeichert...
                            </div>
                        ) : (
                            "Spiel jetzt loggen"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    )
}
