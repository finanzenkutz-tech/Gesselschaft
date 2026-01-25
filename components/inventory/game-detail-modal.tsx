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
import { Input } from '@/components/ui/input'
import { Info, Users, Clock, Star, ExternalLink, Loader2, Archive, CheckCircle2, Gauge, BookOpen, PlayCircle, Edit2, FileText } from 'lucide-react'
import { getBGGGameDetails } from '@/app/(app)/inventory/bgg-actions'
import { updateGame } from '@/app/(app)/inventory/actions'

export function GameDetailModal({
    game
}: {
    game: any
}) {
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // Quickfinder State
    const [rulesUrl, setRulesUrl] = useState(game.rules_url || '')
    const [videoUrl, setVideoUrl] = useState(game.video_url || '')
    const [isEditingLinks, setIsEditingLinks] = useState(false)

    const saveLinks = async () => {
        setLoading(true)
        await updateGame(game.id, { rules_url: rulesUrl, video_url: videoUrl })
        setLoading(false)
        setIsEditingLinks(false)
        window.location.reload()
    }

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
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-blue-200 font-bold">
                                            {details?.yearpublished || 'Erscheinungsjahr unbekannt'}
                                        </p>
                                        {game.category && (
                                            <>
                                                <span className="text-blue-400/50">•</span>
                                                <span className="text-blue-100/80 font-bold text-xs uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-md">
                                                    {game.category}
                                                </span>
                                            </>
                                        )}
                                    </div>
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
                                        {game.complexity ? Number(game.complexity).toFixed(1) : details?.averageweight ? parseFloat(details.averageweight).toFixed(1) : '?'}/5
                                    </p>
                                </div>
                            </div>

                            {/* Regel-Quickfinder */}
                            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                        Regel-Quickfinder
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditingLinks(!isEditingLinks)}
                                        className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {isEditingLinks ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-indigo-400 ml-1">Regel-PDF Link</label>
                                            <Input
                                                placeholder="https://..."
                                                value={rulesUrl}
                                                onChange={e => setRulesUrl(e.target.value)}
                                                className="bg-white border-indigo-200 focus:border-indigo-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-indigo-400 ml-1">Erklärvideo Link</label>
                                            <Input
                                                placeholder="https://youtube.com/..."
                                                value={videoUrl}
                                                onChange={e => setVideoUrl(e.target.value)}
                                                className="bg-white border-indigo-200 focus:border-indigo-400"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={saveLinks} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                Speichern
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {game.rules_url ? (
                                            <a href={game.rules_url} target="_blank" rel="noopener noreferrer" className="block">
                                                <div className="bg-white p-4 rounded-xl border border-indigo-100 flex items-center gap-3 hover:shadow-md hover:border-indigo-300 transition-all group cursor-pointer h-full">
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">Regeln (PDF)</p>
                                                        <p className="text-xs text-slate-400 font-medium">Ansehen</p>
                                                    </div>
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="bg-white/50 p-4 rounded-xl border border-indigo-50 border-dashed flex items-center gap-3 opacity-60">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400">Keine Regeln hinterlegt</span>
                                            </div>
                                        )}

                                        {game.video_url ? (
                                            <a href={game.video_url} target="_blank" rel="noopener noreferrer" className="block">
                                                <div className="bg-white p-4 rounded-xl border border-indigo-100 flex items-center gap-3 hover:shadow-md hover:border-indigo-300 transition-all group cursor-pointer h-full">
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <PlayCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">Erklärvideo</p>
                                                        <p className="text-xs text-slate-400 font-medium">Ansehen</p>
                                                    </div>
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="bg-white/50 p-4 rounded-xl border border-indigo-50 border-dashed flex items-center gap-3 opacity-60">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                                                    <PlayCircle className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400">Kein Video hinterlegt</span>
                                            </div>
                                        )}
                                    </div>
                                )}
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

                            {/* Finanzen Section */}
                            {(game.price_new > 0 || game.price_used > 0) && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <span className="text-[10px] font-black text-emerald-600">€</span>
                                        </div>
                                        Finanzielles
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {game.price_new > 0 && (
                                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Neupreis</p>
                                                <p className="font-extrabold text-blue-700 text-lg">
                                                    {Number(game.price_new).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                                </p>
                                            </div>
                                        )}
                                        {game.price_used > 0 && (
                                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Gebrauchtwert</p>
                                                <p className="font-extrabold text-emerald-700 text-lg">
                                                    {Number(game.price_used).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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

