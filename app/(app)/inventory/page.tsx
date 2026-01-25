import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Dice5, Trash2, ExternalLink, Box, Trophy, Lock, Globe, Users, Star, Clock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeGameFromInventory } from '@/app/(app)/inventory/actions'
import { AddGameForm } from '@/components/inventory/add-game-form'
import { GameDetailModal } from '@/components/inventory/game-detail-modal'
import { BGGSyncButton } from '@/components/inventory/bgg-sync-button'
import { GameTransferDialog } from '@/components/inventory/game-transfer-dialog'
import Link from 'next/link'

export default async function InventoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: games } = await supabase
        .from('inventory')
        .select('*, groups(name)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    const { data: myGroups } = await supabase
        .from('group_members')
        .select('groups(id, name)')
        .eq('user_id', user.id)

    const groups = myGroups?.map((mg: any) => mg.groups).filter(Boolean) || []

    // Get game counts for ranking
    const { data: allGameCounts } = await supabase
        .from('inventory')
        .select('owner_id')

    const userGameCounts = allGameCounts?.reduce((acc: Record<string, number>, g) => {
        acc[g.owner_id] = (acc[g.owner_id] || 0) + 1
        return acc
    }, {}) || {}

    const sortedCounts = Object.values(userGameCounts).sort((a, b) => b - a)
    const myCount = (userGameCounts[user.id] || 0)
    const myRank = sortedCounts.indexOf(myCount) + 1
    const totalPlayers = Object.keys(userGameCounts).length
    const isTopCollector = myRank <= 3 && myCount > 0

    // Calculate collection values
    const totalValueNew = games?.reduce((sum, g) => sum + (Number(g.price_new) || 0), 0) || 0
    const totalValueUsed = games?.reduce((sum, g) => sum + (Number(g.price_used) || 0), 0) || 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Meine Spiele</h1>
                    <p className="text-slate-500 text-lg mt-1">Verwalte deine persönliche Brettspiel-Sammlung.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/inventory/import">
                        <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 hover:border-primary/50 text-slate-600 font-bold bg-white">
                            <Layers className="w-5 h-5 mr-2" /> Massenupload
                        </Button>
                    </Link>
                    <BGGSyncButton />
                    <AddGameForm groups={groups} />
                </div>
            </header>

            {/* Pile of Shame Tracker (Global) */}
            {(() => {
                const totalGames = games?.length || 0
                const unplayedCount = games?.filter((g: any) => g.is_unplayed).length || 0
                const playedPercent = totalGames > 0 ? Math.round(((totalGames - unplayedCount) / totalGames) * 100) : 0

                if (totalGames === 0) return null

                return (
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <Layers className="w-32 h-32 text-slate-900" />
                        </div>

                        {/* Chart / Donut could go here, but Bar is better for "Shame" */}
                        <div className="flex-1 w-full space-y-3 relative z-10">
                            <div className="flex justify-between items-center">
                                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                                    <span className="text-2xl">🔥</span>
                                    Pile of Shame Tracker
                                </h3>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-red-500">{unplayedCount}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase ml-1">Ungespielt</span>
                                </div>
                            </div>

                            <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                {/* Success Part (Green) */}
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 absolute left-0 top-0 transition-all duration-1000"
                                    style={{ width: `${playedPercent}%` }}
                                />
                                {/* Label inside bar if enough space */}
                                {playedPercent > 10 && (
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white drop-shadow-md">
                                        {playedPercent}% Gespielt
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                <span>Total: {totalGames} Spiele</span>
                                <span>Ziel: 100% Gespielt</span>
                            </div>
                        </div>

                        <div className="hidden md:block relative z-10 shrink-0 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-3xl font-black text-slate-800">{playedPercent}%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
                        </div>
                    </div>
                )
            })()}

            {/* Ranking Card */}
            {myCount > 0 && (
                <div className={cn(
                    "relative overflow-hidden p-8 flex flex-col md:flex-row items-center gap-6 rounded-[2.5rem] transition-all duration-700",
                    isTopCollector
                        ? "bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 shadow-2xl shadow-amber-200"
                        : "sky-card border-slate-100"
                )}>
                    {isTopCollector && (
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none mix-blend-overlay" />
                    )}

                    <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative z-10",
                        isTopCollector ? "bg-white text-amber-500 scale-110" : "bg-primary/10 text-primary"
                    )}>
                        <Trophy className={cn("w-10 h-10", isTopCollector ? "fill-amber-400" : "")} />
                        {isTopCollector && (
                            <div className="absolute -top-3 -right-3 bg-white text-amber-600 text-[10px] font-black px-2 py-1 rounded-full shadow-lg border border-amber-100 animate-bounce">TOP</div>
                        )}
                    </div>

                    <div className="flex-1 relative z-10 text-center md:text-left">
                        {isTopCollector ? (
                            <>
                                <h2 className="text-2xl font-black text-amber-900 leading-tight">Elite Sammler Status!</h2>
                                <p className="text-amber-800/80 font-bold text-lg mt-1">
                                    Deine Sammlung gehört zu den Top {myRank === 1 ? '1' : myRank} von {totalPlayers} Spielern.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black text-slate-800 leading-tight">{myCount} Schätze gefunden</h2>
                                <p className="text-slate-500 font-bold mt-1">
                                    {totalPlayers > 1 ? `Du bist auf Platz ${myRank} der besten Sammler.` : 'Sei der erste Sammler bei Game Hub!'}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 ml-auto relative z-10 w-full md:w-auto">
                        <div className={cn(
                            "px-6 py-4 rounded-2xl flex flex-col items-center md:items-start transition-all",
                            isTopCollector ? "bg-white/30 backdrop-blur-md border border-white/40" : "bg-slate-50 border border-slate-100"
                        )}>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isTopCollector ? "text-amber-900/60" : "text-slate-400")}>Neuwert</span>
                            <span className={cn("text-2xl font-black", isTopCollector ? "text-amber-900" : "text-primary")}>
                                {totalValueNew.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                        <div className={cn(
                            "px-6 py-4 rounded-2xl flex flex-col items-center md:items-start transition-all",
                            isTopCollector ? "bg-white/40 backdrop-blur-md border border-white/50" : "bg-emerald-50/50 border border-emerald-100"
                        )}>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isTopCollector ? "text-amber-900/60" : "text-emerald-600/60")}>Marktwert</span>
                            <span className={cn("text-2xl font-black", isTopCollector ? "text-amber-900" : "text-emerald-500")}>
                                {totalValueUsed.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {!games || games.length === 0 ? (
                <div className="sky-card p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 text-primary rounded-3xl flex items-center justify-center mb-6">
                        <Box className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Deine Sammlung ist leer</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        Fange an, deine Lieblingsspiele hinzuzufügen, damit andere sie sehen können.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <div key={game.id} className="sky-card p-6 flex flex-col justify-between group hover:border-primary/20 hover:shadow-xl transition-all min-h-[160px] relative overflow-hidden">
                            {game.image_url && (
                                <div className="absolute top-0 right-0 w-24 h-full opacity-10 group-hover:opacity-20 transition-opacity">
                                    <img src={game.image_url} alt="" className="w-full h-full object-cover grayscale" />
                                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white" />
                                </div>
                            )}

                            {game.is_unplayed && (
                                <div className="absolute top-2 left-2 z-20 bg-red-500 text-white text-[10px] uppercase font-black px-2 py-1 rounded-full shadow-lg border border-red-400">
                                    Pile of Shame 😡
                                </div>
                            )}

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-slate-800 truncate group-hover:text-primary transition-colors" title={game.name}>
                                        {game.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {game.visibility === 'private' && <Lock className="w-3 h-3 text-slate-400" />}
                                        {game.visibility === 'profile' && <Globe className="w-3 h-3 text-green-500" />}
                                        {game.visibility === 'groups' && <Users className="w-3 h-3 text-blue-500" />}
                                        <span className="text-xs text-slate-400 font-medium">
                                            {(() => {
                                                if (game.groups) {
                                                    const groupName = Array.isArray(game.groups) ? game.groups[0]?.name : game.groups.name;
                                                    return `Sichtbar in ${groupName || 'Gruppe'}`;
                                                }
                                                if (game.visibility === 'profile') return 'Öffentlich';
                                                if (game.visibility === 'groups') return 'Gruppen';
                                                if (game.visibility === 'buddies') return 'Buddies';
                                                return 'Privat';
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                        {typeof game.complexity === 'number' && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                                <span>{Number(game.complexity).toFixed(1)}/5</span>
                                            </div>
                                        )}
                                        {(game.min_players || game.max_players) && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                <Users className="w-2.5 h-2.5 text-blue-400" />
                                                <span>
                                                    {game.min_players === game.max_players
                                                        ? `${game.min_players}`
                                                        : `${game.min_players}-${game.max_players}`} Spieler
                                                </span>
                                            </div>
                                        )}
                                        {game.playtime && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                <Clock className="w-2.5 h-2.5 text-green-400" />
                                                <span>{game.playtime} Min</span>
                                            </div>
                                        )}
                                        {game.category && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter w-full mt-0.5">
                                                <Layers className="w-2.5 h-2.5 text-purple-400" />
                                                <span className="truncate max-w-[150px]">{game.category}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-1 border-t border-slate-50 pt-1 w-full">
                                            {game.price_new > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <span className="text-slate-300">Neu:</span>
                                                    <span className="text-primary">{Number(game.price_new).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                                                </div>
                                            )}
                                            {game.price_used > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <span className="text-slate-300">Gebraucht:</span>
                                                    <span className="text-emerald-500">{Number(game.price_used).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {game.notes && (
                                        <div className="mt-3 p-2 bg-amber-50/50 rounded-lg border border-amber-100/50 text-[10px] text-slate-500 italic line-clamp-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3 text-amber-500 shrink-0" />
                                            {game.notes}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {game.bgg_link && (
                                        <a href={game.bgg_link} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    )}
                                    <GameTransferDialog game={game} currentUserId={user.id} />
                                    <form action={async () => { 'use server'; await removeGameFromInventory(game.id) }}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <GameDetailModal game={game} />
                                <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                                    ID: {game.bgg_link?.split('/').pop() || 'n/a'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    )
}

