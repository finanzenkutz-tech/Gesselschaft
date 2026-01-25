'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trophy, Dice5, Check, Search, MapPin, Trash2, Save } from 'lucide-react'
import { updateGameSession, deleteGameSession } from '@/app/groups/game-actions'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { AddPlaceDialog } from '@/components/groups/add-place-dialog'

interface EditGameSessionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: any
    groupId: string
    games: any[]
    members: any[]
    places: any[]
}

export function EditGameSessionDialog({ open, onOpenChange, session, groupId, games, members, places }: EditGameSessionDialogProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [gameName, setGameName] = useState('')
    const [selectedGameImage, setSelectedGameImage] = useState<string | undefined>(undefined)
    const [playedAt, setPlayedAt] = useState('')
    const [location, setLocation] = useState('')
    const [scores, setScores] = useState<Record<string, number>>({})
    const [brings, setBrings] = useState<Record<string, string>>({})
    const [punctuality, setPunctuality] = useState<Record<string, boolean>>({})
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
    const [winnerId, setWinnerId] = useState<string | undefined>(undefined)
    const [comment, setComment] = useState('')
    const [isLocationFocused, setIsLocationFocused] = useState(false)
    const [isGameFocused, setIsGameFocused] = useState(false)

    // Load session data when opened
    useEffect(() => {
        if (session && open) {
            setGameName(session.game_name || '')
            setSelectedGameImage(session.game_image_url || undefined)
            // Format date for datetime-local input
            const date = new Date(session.played_at)
            const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
            setPlayedAt(isoString)
            setLocation(session.location || '')
            setComment(session.report_text || '')
            setWinnerId(session.winner_id || undefined)

            // Players mapping
            const pIds: string[] = []
            const s: Record<string, number> = {}
            const b: Record<string, string> = {}
            const p: Record<string, boolean> = {}

            session.game_session_players?.forEach((player: any) => {
                pIds.push(player.user_id)
                if (player.score !== null) s[player.user_id] = player.score
                if (player.brings) b[player.user_id] = player.brings
                if (player.is_punctual !== null) p[player.user_id] = player.is_punctual
            })

            setSelectedPlayers(pIds)
            setScores(s)
            setBrings(b)
            setPunctuality(p)
        }
    }, [session, open])

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
            if (winnerId === userId) setWinnerId(undefined)
        } else {
            setSelectedPlayers(prev => [...prev, userId])
        }
    }

    const handleSelectGame = (game: any) => {
        setGameName(game.name)
        setSelectedGameImage(game.image_url || undefined)
        setIsGameFocused(false)
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

    const handleSubmit = async () => {
        if (!gameName.trim()) return toast.error("Bitte gib einen Spielnamen ein")
        if (selectedPlayers.length === 0) return toast.error("Wer hat mitgespielt?")

        setLoading(true)
        try {
            await updateGameSession(session.id, {
                gameName,
                gameImageUrl: selectedGameImage,
                playedAt: new Date(playedAt).toISOString(),
                playerIds: selectedPlayers,
                winnerId: winnerId,
                scores: scores,
                location: location.trim() || undefined,
                comment: comment.trim() || undefined,
                brings: brings,
                punctuality: punctuality
            })
            onOpenChange(false)
            router.refresh()
            toast.success("Spiel aktualisiert!")
        } catch (error) {
            toast.error("Fehler beim Speichern")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Spiel wirklich löschen?")) return
        setLoading(true)
        try {
            await deleteGameSession(session.id)
            onOpenChange(false)
            router.refresh()
            toast.success("Spiel gelöscht")
        } catch (error) {
            toast.error("Fehler beim Löschen")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Spiel bearbeiten</DialogTitle>
                    <DialogDescription>
                        Details anpassen oder Spiel löschen
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Game Selection */}
                    <div className="space-y-2 relative">
                        <Label>Spiel</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Name des Spiels..."
                                value={gameName}
                                onChange={(e) => setGameName(e.target.value)}
                                onFocus={() => setIsGameFocused(true)}
                                onBlur={() => setTimeout(() => setIsGameFocused(false), 200)}
                                className="pl-10 rounded-xl"
                            />
                        </div>
                        {isGameFocused && gameName && filteredGames.length > 0 && !games.find(g => g.name === gameName) && (
                            <div className="absolute z-10 w-full bg-white border border-slate-100 shadow-xl rounded-xl mt-1 overflow-hidden max-h-40 overflow-y-auto">
                                {filteredGames.slice(0, 5).map(game => (
                                    <button
                                        key={game.id}
                                        onClick={() => handleSelectGame(game)}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                                    >
                                        <Dice5 className="w-4 h-4 text-slate-400" />
                                        {game.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2">
                            <Label>Wann?</Label>
                            <Input
                                type="datetime-local"
                                value={playedAt}
                                onChange={(e) => setPlayedAt(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        {/* Location */}
                        <div className="space-y-2">
                            <Label>Wo?</Label>
                            <div className="relative group/location">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Ort suchen..."
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            onFocus={() => setIsLocationFocused(true)}
                                            onBlur={() => setTimeout(() => setIsLocationFocused(false), 200)}
                                            className="pl-10 rounded-xl"
                                        />
                                    </div>
                                    <AddPlaceDialog
                                        groupId={groupId}
                                        trigger={
                                            <Button size="icon" variant="outline" className="shrink-0 rounded-xl" title="Neuen Ort hinzufügen">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        }
                                        onSuccess={() => router.refresh()}
                                    />
                                </div>
                                {(isLocationFocused || location) && filteredPlaces.length > 0 && !places.find(p => p.name === location) && (
                                    <div className="absolute z-10 w-full bg-white border border-slate-100 shadow-xl rounded-xl mt-1 overflow-hidden max-h-40 overflow-y-auto">
                                        {filteredPlaces.map(place => (
                                            <button
                                                key={place.id}
                                                onClick={() => handleSelectPlace(place.name)}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                                            >
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                {place.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label>Kommentar / Notizen</Label>
                        <Textarea
                            placeholder="Wichtige Details zur Runde..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="rounded-xl min-h-[80px]"
                        />
                    </div>

                    {/* Players */}
                    <div className="space-y-3">
                        <Label>Wer war dabei? ({selectedPlayers.length})</Label>
                        <ScrollArea className="h-72 rounded-xl border border-slate-200 p-2 bg-slate-50/50">
                            <div className="flex flex-col gap-2">
                                {members.map((member: any) => {
                                    const isSelected = selectedPlayers.includes(member.user_id)
                                    return (
                                        <div
                                            key={member.user_id}
                                            className={cn(
                                                "rounded-xl transition-all border overflow-hidden",
                                                isSelected
                                                    ? "bg-white border-blue-200 shadow-sm"
                                                    : "bg-white/50 border-transparent opacity-80"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-center gap-3 p-2 cursor-pointer transition-colors",
                                                    isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"
                                                )}
                                                onClick={() => togglePlayer(member.user_id)}
                                            >
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={member.profiles?.avatar_url} />
                                                    <AvatarFallback>{member.profiles?.full_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate font-medium flex-1 text-sm">{member.profiles?.full_name}</span>
                                                {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                                            </div>

                                            {isSelected && (
                                                <div className="p-3 grid grid-cols-2 gap-3 text-xs border-t border-slate-100 animate-in slide-in-from-top-2">
                                                    {/* Score & Winner */}
                                                    <div className="space-y-1">
                                                        <span className="text-slate-500 font-medium">Ergebnis</span>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="Punkte"
                                                                className="h-8 text-right bg-white"
                                                                value={scores[member.user_id] ?? ''}
                                                                onChange={(e) => handleScoreChange(member.user_id, e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => setWinnerId(winnerId === member.user_id ? undefined : member.user_id)}
                                                                title="Gewinner markieren"
                                                                className={cn(
                                                                    "h-8 w-8 flex items-center justify-center rounded-lg border transition-all",
                                                                    winnerId === member.user_id
                                                                        ? "bg-amber-100 text-amber-600 border-amber-200 shadow-sm"
                                                                        : "bg-white text-slate-300 hover:text-amber-400 border-slate-200"
                                                                )}
                                                            >
                                                                <Trophy className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Punctuality & Brings */}
                                                    <div className="space-y-1">
                                                        <span className="text-slate-500 font-medium">Details</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => togglePunctual(member.user_id)}
                                                                title="War pünktlich?"
                                                                className={cn(
                                                                    "h-8 px-2 flex items-center justify-center rounded-lg border transition-all text-xs",
                                                                    (punctuality[member.user_id] ?? true)
                                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                                        : "bg-red-50 text-red-600 border-red-200"
                                                                )}
                                                            >
                                                                {(punctuality[member.user_id] ?? true) ? "Pünktl." : "Zu spät"}
                                                            </button>
                                                            <Input
                                                                placeholder="Mitgebracht..."
                                                                className="h-8 text-xs bg-white flex-1"
                                                                value={brings[member.user_id] ?? ''}
                                                                onChange={(e) => handleBringsChange(member.user_id, e.target.value)}
                                                            />
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

                    <div className="flex gap-4">
                        <Button
                            onClick={handleDelete}
                            disabled={loading}
                            variant="destructive"
                            className="flex-1 rounded-xl h-12 text-base bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 shadow-none"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Löschen
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-[2] rounded-xl h-12 text-base"
                        >
                            {loading ? 'Speichert...' : <>
                                <Save className="w-4 h-4 mr-2" />
                                Speichern
                            </>}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
