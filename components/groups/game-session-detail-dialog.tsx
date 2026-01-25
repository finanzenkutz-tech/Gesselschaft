'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getGameSessionDetails } from '@/app/(app)/groups/game-actions'
import { Calendar, MapPin, Trophy, Clock3, Users, Star, Loader2, Quote } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'

interface GameSessionDetailDialogProps {
    sessionId: string
    trigger: React.ReactNode
}

export function GameSessionDetailDialog({ sessionId, trigger }: GameSessionDetailDialogProps) {
    const [open, setOpen] = useState(false)
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && !session) {
            setLoading(true)
            getGameSessionDetails(sessionId)
                .then(data => {
                    if (data) {
                        setSession(data)
                    } else {
                        console.error('No data returned for sessionId:', sessionId)
                    }
                })
                .catch(err => {
                    console.error('Error in GameSessionDetailDialog:', err)
                })
                .finally(() => setLoading(false))
        }
    }, [open, sessionId, session])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden gap-0">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="font-bold text-sm">Lade Spieldetails...</p>
                    </div>
                ) : session ? (
                    <>
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:32px_32px] opacity-20" />

                            <DialogHeader>
                                <div className="flex items-start justify-between gap-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 text-blue-200 text-xs font-black uppercase tracking-widest mb-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(session.played_at).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <DialogTitle className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                                            {session.game_name}
                                        </DialogTitle>
                                        <div className="flex flex-wrap gap-2">
                                            {session.location && (
                                                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                                                    <MapPin className="w-3 h-3" /> {session.location}
                                                </span>
                                            )}
                                            {session.duration_minutes && (
                                                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                                                    <Clock3 className="w-3 h-3" /> {session.duration_minutes} Min.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {session.game_image_url && (
                                        <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden shadow-xl shrink-0">
                                            <img src={session.game_image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </DialogHeader>
                        </div>

                        <div className="p-6 md:p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Comment */}
                            {session.report_text && (
                                <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex gap-4 relative">
                                    <Quote className="w-8 h-8 text-amber-200 shrink-0" />
                                    <p className="text-slate-700 font-medium italic relative z-10">
                                        "{session.report_text}"
                                    </p>
                                </div>
                            )}

                            {/* Players Table */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Spielergebnisse
                                </h3>
                                <div className="bg-slate-50 rounded-3xl border border-slate-100 divide-y divide-slate-100/50 overflow-hidden">
                                    {(session.game_session_players || [])
                                        .sort((a: any, b: any) => {
                                            if (a.placement && b.placement) return a.placement - b.placement
                                            if (a.score && b.score) return b.score - a.score
                                            return 0
                                        })
                                        .map((player: any) => {
                                            const isWinner = session.winner_id === player?.profiles?.id
                                            if (!player || !player.profiles) return null;
                                            return (
                                                <div key={player.profiles.id} className={cn(
                                                    "flex items-center justify-between p-4",
                                                    isWinner ? "bg-amber-50/30" : "hover:bg-white transition-colors"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Avatar className={cn(
                                                                "w-10 h-10 border-2",
                                                                isWinner ? "border-amber-400" : "border-white shadow-sm"
                                                            )}>
                                                                <AvatarImage src={player.profiles.avatar_url} />
                                                                <AvatarFallback className="bg-slate-200 font-black text-slate-500">
                                                                    {player.profiles.full_name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {player.placement && (
                                                                <div className={cn(
                                                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm",
                                                                    player.placement === 1 ? "bg-amber-400 text-white" :
                                                                        player.placement === 2 ? "bg-slate-300 text-white" :
                                                                            player.placement === 3 ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-500"
                                                                )}>
                                                                    {player.placement}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className={cn(
                                                                "font-bold text-sm",
                                                                isWinner ? "text-amber-700" : "text-slate-700"
                                                            )}>
                                                                {player.profiles.full_name}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {isWinner && (
                                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                                        <Trophy className="w-3 h-3" /> Gewinner
                                                                    </span>
                                                                )}
                                                                {!player.is_punctual && (
                                                                    <span className="text-[9px] font-bold text-red-400 uppercase">Verspätet</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        {player.score !== null ? (
                                                            <div className="font-black text-lg text-slate-800 tabular-nums">
                                                                {player.score}
                                                                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Pkt</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-300 font-bold text-xl">–</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="text-center">
                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                                    Geloggt von {session.creator?.full_name || 'Unbekannt'} am {new Date(session.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-red-500 font-bold">
                        Fehler beim Laden.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

