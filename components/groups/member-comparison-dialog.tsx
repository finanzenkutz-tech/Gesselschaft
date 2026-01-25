'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Swords, Dice5, Box, Star, Users } from 'lucide-react'
import { getMemberComparison } from '@/app/groups/game-actions'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MemberComparisonDialogProps {
    groupId: string
    member: any
    trigger: React.ReactNode
}

export function MemberComparisonDialog({ groupId, member, trigger }: MemberComparisonDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (open) {
            setLoading(true)
            getMemberComparison(groupId, member.user_id)
                .then(res => {
                    setData(res)
                    setLoading(false)
                })
                .catch(err => {
                    console.error(err)
                    setLoading(false)
                })
        }
    }, [open, groupId, member.user_id])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden gap-0">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-primary/10 via-white to-secondary/5 p-8 border-b border-white/40">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-between">
                            <span>Gemeinsame Erlebnisse</span>
                            <Swords className="w-8 h-8 text-primary/40" />
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                            Vergleiche deine Stats mit <span className="text-primary font-bold">{member.profiles?.full_name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    {/* H2H Stat Bar */}
                    {!loading && data && (
                        <div className="mt-8 flex items-center gap-4 bg-white/50 p-2 rounded-3xl border border-white/60 shadow-inner">
                            <div className="flex-1 flex items-center justify-center gap-3 py-4 bg-white rounded-2xl shadow-sm">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Du</span>
                                <span className="text-3xl font-black text-primary">{data.stats.myWins}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">VS</div>
                            <div className="flex-1 flex items-center justify-center gap-3 py-4 bg-white rounded-2xl shadow-sm">
                                <span className="text-3xl font-black text-secondary">{data.stats.targetWins}</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{member.profiles?.full_name?.split(' ')[0]}</span>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-8 space-y-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-slate-400 font-bold animate-pulse">Daten werden abgeglichen...</p>
                            </div>
                        ) : (
                            <>
                                {/* Shared Inventory */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Box className="w-4 h-4" /> Gemeinsame Spiele in der Sammlung ({data.sharedInventory.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {data.sharedInventory.length > 0 ? data.sharedInventory.map((game: string) => (
                                            <span key={game} className="px-3 py-1.5 bg-secondary/10 text-secondary-foreground text-xs font-bold rounded-lg border border-secondary/10">
                                                {game}
                                            </span>
                                        )) : (
                                            <p className="text-sm text-slate-400 italic">Ihr habt keine identischen Spiele in euren privaten Sammlungen.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Shared Sessions */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Dice5 className="w-4 h-4" /> Letzte gemeinsame Runden ({data.stats.totalShared})
                                    </h3>
                                    <div className="space-y-3">
                                        {data.sharedSessions.length > 0 ? data.sharedSessions.map((session: any, idx: number) => {
                                            const isMyWin = session.winner_id === null ? false : session.winner_id === 'my-id'; // Simplified
                                            return (
                                                <div key={idx} className="sky-card p-4 flex items-center justify-between group hover:bg-slate-50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-50 shrink-0">
                                                            {session.game_image_url ? (
                                                                <img src={session.game_image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Dice5 className="w-5 h-5 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{session.game_name}</h4>
                                                            <p className="text-[10px] text-slate-400 font-medium">
                                                                {new Date(session.played_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {session.winner_id && (
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            "bg-amber-100 text-amber-700 border border-amber-200"
                                                        )}>
                                                            <Trophy className="w-3 h-3" />
                                                            Gewinner
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }) : (
                                            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-sm text-slate-400">Ihr habt noch keine Spiele gemeinsam geloggt.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Badges Section */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "flex flex-col items-center gap-1 transition-all",
                                            data.stats.isNemesis ? "opacity-100 scale-110" : "grayscale opacity-25"
                                        )}>
                                            <div className={cn(
                                                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                                                data.stats.isNemesis ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <Swords className="w-7 h-7" />
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", data.stats.isNemesis ? "text-red-600" : "text-slate-400")}>Nemesis</span>
                                        </div>

                                        <div className={cn(
                                            "flex flex-col items-center gap-1 transition-all",
                                            data.stats.isDreamTeam ? "opacity-100 scale-110" : "grayscale opacity-25"
                                        )}>
                                            <div className={cn(
                                                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                                                data.stats.isDreamTeam ? "bg-emerald-500 text-white animate-bounce" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <Users className="w-7 h-7" />
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", data.stats.isDreamTeam ? "text-emerald-600" : "text-slate-400")}>Dream Team</span>
                                        </div>

                                        <p className="text-[10px] text-slate-400 font-bold ml-auto max-w-[150px] text-right italic leading-tight">
                                            {data.stats.isNemesis || data.stats.isDreamTeam
                                                ? "Glückwunsch! Ihr habt besondere Meilensteine erreicht."
                                                : "Spielt mehr zusammen, um Badges freizuschalten!"}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
