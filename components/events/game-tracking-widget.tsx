'use client'

import { useState } from 'react'
import { Dice5, Plus, Users, Trophy, Medal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { createGameSession, addPlayerToSession } from '@/app/(app)/events/session-actions'
import { useRouter } from 'next/navigation'

type GameSession = {
    id: string
    game_name: string
    game_image_url: string | null
    played_at: string
    game_session_players: {
        user_id: string
        score: number | null
        placement: number | null
        profiles: {
            full_name: string | null
            avatar_url: string | null
        }
    }[]
    report_text?: string | null
    report_image_url?: string | null
    winner_id?: string | null
}

type Attendee = {
    user_id: string
    profiles: {
        full_name: string | null
        avatar_url: string | null
    }
}

export function GameTrackingWidget({
    eventId,
    sessions,
    attendees,
    userId
}: {
    eventId: string
    sessions: GameSession[]
    attendees: Attendee[]
    userId?: string
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleCreateSession(formData: FormData) {
        setLoading(true)
        formData.append('event_id', eventId)
        await createGameSession(formData)
        setLoading(false)
        setOpen(false)
        router.refresh()
    }

    return (
        <section className="sky-card p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Dice5 className="w-6 h-6 text-purple-500" />
                    Gespielte Spiele
                </h2>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50">
                            <Plus className="w-4 h-4 mr-2" />
                            Spiel hinzufügen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white">
                            <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                                <Dice5 className="w-8 h-8" /> Spiel tracken
                            </DialogTitle>
                            <DialogDescription className="text-purple-100 mt-2 opacity-90">
                                Welches Spiel wurde gespielt?
                            </DialogDescription>
                        </div>
                        <form action={handleCreateSession} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Spielname</label>
                                    <Input name="game_name" placeholder="z.B. Catan" required className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Bild-URL (optional)</label>
                                    <Input name="game_image_url" placeholder="https://..." className="rounded-xl bg-slate-50 border-slate-100 h-12" />
                                </div>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-purple-200">
                                {loading ? 'Speichere...' : 'Spiel hinzufügen'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {sessions.length === 0 ? (
                <p className="text-slate-400 text-center py-8 italic">Noch keine Spiele für dieses Event getrackt.</p>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center overflow-hidden">
                                    {session.game_image_url ? (
                                        <img src={session.game_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Dice5 className="w-7 h-7 text-purple-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">{session.game_name}</h3>
                                    <p className="text-xs text-slate-400">
                                        {new Date(session.played_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>

                            {session.game_session_players.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Spieler ({session.game_session_players.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {session.game_session_players
                                            .sort((a, b) => (a.placement || 99) - (b.placement || 99))
                                            .map((player) => (
                                                <div key={player.user_id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-purple-100">
                                                    {player.placement === 1 && <Trophy className="w-3 h-3 text-yellow-500" />}
                                                    {player.placement === 2 && <Medal className="w-3 h-3 text-slate-400" />}
                                                    {player.placement === 3 && <Medal className="w-3 h-3 text-amber-600" />}
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {player.profiles?.full_name || 'Anonym'}
                                                    </span>
                                                    {player.score && (
                                                        <span className="text-xs text-purple-500 font-bold">({player.score})</span>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {(session.report_text || session.report_image_url) && (
                                <div className="mt-4 pt-4 border-t border-purple-100/50">
                                    {session.report_text && (
                                        <div className="p-3 bg-white rounded-xl border border-purple-100 text-sm italic text-slate-600">
                                            "{session.report_text}"
                                        </div>
                                    )}
                                    {session.report_image_url && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-purple-100">
                                            <img src={session.report_image_url} alt="Result" className="w-full h-auto object-cover max-h-64" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

