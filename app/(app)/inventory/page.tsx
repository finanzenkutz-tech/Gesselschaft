import { createClient } from '@/lib/supabase/server'
import { Dice5, Trash2, ExternalLink, Box, Trophy, Lock, Globe, Users, Star, Clock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeGameFromInventory } from '@/app/inventory/actions'
import { AddGameForm } from '@/components/inventory/add-game-form'
import { GameDetailModal } from '@/components/inventory/game-detail-modal'
import { BGGSyncButton } from '@/components/inventory/bgg-sync-button'

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Meine Spiele</h1>
                    <p className="text-slate-500 text-lg mt-1">Verwalte deine persönliche Brettspiel-Sammlung.</p>
                </div>

                <div className="flex items-center gap-2">
                    <BGGSyncButton />
                    <AddGameForm groups={groups} />
                </div>
            </header>

            {/* Ranking Card */}
            {myCount > 0 && (
                <div className={`sky-card p-6 flex items-center gap-4 ${isTopCollector ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : ''}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isTopCollector ? 'bg-yellow-100 text-yellow-600' : 'bg-primary/10 text-primary'}`}>
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        {isTopCollector ? (
                            <>
                                <p className="font-extrabold text-lg text-yellow-700">🏆 Top-Sammler!</p>
                                <p className="text-yellow-600 text-sm">
                                    Du hast mehr Spiele als die meisten anderen ({myCount} Spiele, Platz {myRank} von {totalPlayers})
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-bold text-slate-800">{myCount} {myCount === 1 ? 'Spiel' : 'Spiele'} in deiner Sammlung</p>
                                <p className="text-slate-500 text-sm">
                                    {totalPlayers > 1 ? `Platz ${myRank} von ${totalPlayers} Spielern bei Game Hub` : 'Sei der erste Sammler bei Game Hub!'}
                                </p>
                            </>
                        )}
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
                                    </div>
                                </div>
                                <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {game.bgg_link && (
                                        <a href={game.bgg_link} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    )}
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
            )}
        </div>
    )
}
