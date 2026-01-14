'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info, Users, Clock, Star, ExternalLink, Loader2, Archive, CheckCircle2, Gauge } from 'lucide-react'
import { getBGGGameDetails } from '@/app/inventory/bgg-actions'
import { updateGame } from '@/app/inventory/actions'

export function GameDetailModal({
    game
}: {
    game: any
}) {
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const bggId = game.bgg_link?.split('/').pop()

    async function handleOpen() {
        setOpen(true)
        if (details || !bggId) return

        setLoading(true)
        const data = await getBGGGameDetails(bggId)
        setDetails(data)
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    onClick={handleOpen}
                    className="flex items-center gap-2 mt-4 hover:text-primary transition-colors text-left group/btn"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                        <Info className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider group-hover/btn:text-primary">Details ansehen</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] overflow-y-auto">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-slate-400 font-bold animate-pulse">Lade Spieldaten von BGG...</p>
                    </div>
                ) : (
                    <>
                        <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                            {game.image_url ? (
                                <img src={game.image_url} alt={game.name} className="w-full h-full object-cover opacity-40 blur-sm scale-110" />
                            ) : null}
                            <div className="absolute inset-0 flex items-center p-8 gap-6">
                                <div className="w-32 h-32 rounded-2xl bg-white shadow-2xl overflow-hidden border-4 border-white shrink-0">
                                    <img src={game.image_url || '/würfel.png'} alt={game.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-white">
                                    <h2 className="text-3xl font-extrabold leading-tight">{game.name}</h2>
                                    <p className="text-blue-200 font-bold mt-1">
                                        {details?.yearpublished || 'Erscheinungsjahr unbekannt'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                    <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Spieler</p>
                                    <p className="font-extrabold text-slate-700">
                                        {details?.minplayers}-{details?.maxplayers || '?'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                    <Clock className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dauer</p>
                                    <p className="font-extrabold text-slate-700">
                                        {details?.playingtime || '?'} Min
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                    <Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alter</p>
                                    <p className="font-extrabold text-slate-700">
                                        {details?.minage || '?'}+
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                    <Gauge className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gewicht</p>
                                    <p className="font-extrabold text-slate-700">
                                        {game.complexity ? game.complexity.toFixed(1) : details?.averageweight ? parseFloat(details.averageweight).toFixed(1) : '?'}/5
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary" />
                                    Beschreibung
                                </h3>
                                <div
                                    className="text-slate-600 text-sm leading-relaxed prose prose-slate max-w-none prose-sm"
                                    dangerouslySetInnerHTML={{ __html: details?.description || 'Keine Beschreibung verfügbar.' }}
                                />
                            </div>

                            {/* Actions / Edit */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${game.is_unplayed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {game.is_unplayed ? <Archive className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">Pile of Shame</p>
                                            <p className="text-xs text-slate-500">
                                                {game.is_unplayed ? 'Noch ungespielt!' : 'Bereits gespielt'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={game.is_unplayed ? "default" : "outline"}
                                        size="sm"
                                        onClick={async () => {
                                            setLoading(true)
                                            await updateGame(game.id, { is_unplayed: !game.is_unplayed })
                                            setLoading(false)
                                            window.location.reload() // Simple reload to reflect props update
                                        }}
                                        className={game.is_unplayed ? "bg-red-500 hover:bg-red-600" : "hover:text-green-600"}
                                    >
                                        {game.is_unplayed ? 'Gespielt markieren' : 'Ungespielt'}
                                    </Button>
                                </div>

                                {game.bgg_link && (
                                    <a href={game.bgg_link} target="_blank" rel="noopener noreferrer" className="block">
                                        <Button className="w-full bg-slate-800 hover:bg-black text-white rounded-xl h-12 font-bold shadow-lg shadow-slate-200">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Auf BGG ansehen
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
