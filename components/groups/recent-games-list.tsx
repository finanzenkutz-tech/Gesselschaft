'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Users, Calendar, Trophy, Medal, Clock, Crown, ChevronRight, Pencil, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { EditGameSessionDialog } from './edit-game-session-dialog'

interface RecentGame {
    game_name: string
    last_played_at: string
    play_count: number
    last_session_id: string
    game_image_url: string | null
}

interface GameStats {
    lastSession: any
    topWinner: any
}

export function RecentGamesList({ games, groupId, members, places, allGames }: { games: RecentGame[], groupId: string, members?: any[], places?: any[], allGames?: any[] }) {
    const [selectedGame, setSelectedGame] = useState<RecentGame | null>(null)
    const [stats, setStats] = useState<GameStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Edit Dialog State
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [sessionToEdit, setSessionToEdit] = useState<any>(null)

    const supabase = createClient()

    const handleEditClick = () => {
        if (stats?.lastSession) {
            setSessionToEdit(stats.lastSession)
            setIsEditOpen(true)
        }
    }

    const handleGameClick = async (game: RecentGame) => {
        setSelectedGame(game)
        setIsOpen(true)
        setLoading(true)
        setStats(null)

        try {
            // 1. Fetch Last Played Session details (players)
            const { data: lastSession, error: sessionError } = await supabase
                .from('game_sessions')
                .select(`
                    *,
                    game_session_players(
                        score,
                        placement,
                        user_id,
                        id,
                        profiles(
                            id,
                            full_name,
                            avatar_url
                        )
                    ),
                    winner:winner_id(
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('id', game.last_session_id)
                .single()

            if (sessionError) throw sessionError

            // 2. Fetch Most Wins stats
            // We need to count winners for this game in this group
            // Using nested query filtering
            const { data: allSessions, error: statsError } = await supabase
                .from('game_sessions')
                .select(`
                    winner_id,
                    events!inner(group_id)
                `)
                .eq('game_name', game.game_name)
                .eq('events.group_id', groupId)
                .not('winner_id', 'is', null)

            if (statsError) throw statsError

            // Calculate winner stats
            const winCounts: Record<string, number> = {}
            allSessions?.forEach((s: any) => {
                if (s.winner_id) winCounts[s.winner_id] = (winCounts[s.winner_id] || 0) + 1
            })

            let topWinnerId = null
            let maxWins = 0
            Object.entries(winCounts).forEach(([uid, count]) => {
                if (count > maxWins) {
                    maxWins = count
                    topWinnerId = uid
                }
            })

            let topWinnerProfile = null
            if (topWinnerId) {
                const { data: p } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .eq('id', topWinnerId)
                    .single()
                topWinnerProfile = p
            }

            setStats({
                lastSession,
                topWinner: topWinnerProfile ? { ...topWinnerProfile, wins: maxWins } : null
            })
        } catch (error) {
            console.error('Error loading game stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!games || games.length === 0) return null

    return (
        <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                Zuletzt gespielt
            </h2>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex gap-4">
                    {games.map((game) => (
                        <button
                            key={game.game_name}
                            onClick={() => handleGameClick(game)}
                            className="flex-shrink-0 w-36 md:w-48 group relative flex flex-col items-center space-y-2 p-3 md:p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner text-2xl md:text-4xl">
                                {game.game_image_url ? (
                                    <img src={game.game_image_url} alt={game.game_name} className="w-full h-full object-cover" />
                                ) : (
                                    '🎲'
                                )}
                            </div>
                            <div className="w-full text-center">
                                <h3 className="font-bold text-xs md:text-sm text-slate-700 truncate w-full px-1" title={game.game_name}>
                                    {game.game_name}
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {new Date(game.last_played_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                            <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] h-5 px-1.5 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                {game.play_count}x
                            </Badge>
                        </button>
                    ))}
                </div>
            </ScrollArea>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <span className="bg-blue-100 p-2 rounded-xl text-2xl">
                                    {selectedGame?.game_image_url ? (
                                        <img src={selectedGame.game_image_url} alt="Thumbnail" className="w-8 h-8 rounded-lg object-cover" />
                                    ) : '🎲'}
                                </span>
                                {selectedGame?.game_name}
                            </DialogTitle>
                            {stats?.lastSession && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={handleEditClick}>
                                    <Pencil className="w-4 h-4 text-slate-400" />
                                </Button>
                            )}
                        </div>
                        <DialogDescription>
                            Statistiken in dieser Gruppe
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="py-8 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : stats ? (
                        <div className="space-y-6 pt-4">
                            {/* Last Played Info */}
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        Zuletzt am {new Date(selectedGame!.last_played_at).toLocaleDateString('de-DE', { dateStyle: 'long' })}
                                    </div>
                                    <Badge variant="outline" className="bg-white">
                                        {stats.lastSession?.game_session_players?.length || 0} Spieler
                                    </Badge>
                                </div>

                                {stats.lastSession?.location && (
                                    <div className="flex items-center gap-2 text-primary bg-primary/5 px-3 py-2 rounded-xl border border-primary/10">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-xs font-black uppercase tracking-wider">{stats.lastSession.location}</span>
                                    </div>
                                )}

                                {stats.lastSession?.report_text && (
                                    <div className="bg-white border border-slate-100 p-3 rounded-xl italic text-xs text-slate-500 shadow-inner relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                                        "{stats.lastSession.report_text}"
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    {stats.lastSession?.game_session_players
                                        ?.sort((a: any, b: any) => {
                                            if (a.score !== null && b.score !== null) return b.score - a.score
                                            return 0
                                        })
                                        .map((player: any) => (
                                            <div key={player.user_id || player.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 border border-slate-100">
                                                        <AvatarImage src={player.profiles?.avatar_url} />
                                                        <AvatarFallback className="text-[10px] bg-slate-50">
                                                            {player.profiles?.full_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                            {player.profiles?.full_name}
                                                            {stats.lastSession.winner_id === player.user_id && (
                                                                <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                {player.score !== null && (
                                                    <Badge variant="secondary" className="font-mono text-slate-600 bg-slate-50">
                                                        {player.score} Pkt.
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Most Wins */}
                            {stats.topWinner ? (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center text-amber-600">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Meiste Siege</p>
                                            <p className="font-bold text-slate-800">{stats.topWinner.full_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl font-black text-amber-500">{stats.topWinner.wins}</span>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase">Siege</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-xs italic">Noch keine Siege verzeichnet.</p>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-400">
                            Keine Daten verfügbar.
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            {sessionToEdit && (
                <EditGameSessionDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    session={sessionToEdit}
                    groupId={groupId}
                    games={allGames || []}
                    members={members || []}
                    places={places || []}
                />
            )}
        </div>
    )
}
