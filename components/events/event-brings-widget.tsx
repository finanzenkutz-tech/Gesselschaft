'use client'

import { useState } from 'react'
import { Plus, Trash2, Backpack, Gamepad2, Package, CheckCircle2, User, Hand, MessageCircleQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addBringItem, removeBringItem, addRequestItem, claimRequest, unclaimRequest } from '@/app/events/feature-actions'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EventBringsWidgetProps {
    eventId: string
    brings: any[]
    myInventory: any[]
    userId: string | undefined
}

export function EventBringsWidget({ eventId, brings, myInventory, userId }: EventBringsWidgetProps) {
    const [mode, setMode] = useState<'custom' | 'inventory' | 'request'>('custom')
    const [customItem, setCustomItem] = useState('')
    const [selectedGame, setSelectedGame] = useState('')
    const [loading, setLoading] = useState(false)

    // Filter items
    const requests = brings.filter(b => b.is_request)
    const activeBrings = brings.filter(b => !b.is_request)

    async function handleSubmit() {
        setLoading(true)
        const formData = new FormData()
        formData.append('event_id', eventId)

        if (mode === 'request') {
            if (!customItem.trim()) { setLoading(false); return }
            formData.append('custom_item', customItem)
            await addRequestItem(formData)
        } else {
            if (mode === 'custom') {
                if (!customItem.trim()) { setLoading(false); return }
                formData.append('custom_item', customItem)
            } else {
                if (!selectedGame) { setLoading(false); return }
                formData.append('inventory_id', selectedGame)
            }
            await addBringItem(formData)
        }

        setCustomItem('')
        setSelectedGame('')
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Wirklich entfernen?')) return
        await removeBringItem(id, eventId)
    }

    async function handleClaim(id: string) {
        setLoading(true)
        try {
            await claimRequest(id, eventId)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    async function handleUnclaim(id: string) {
        setLoading(true)
        try {
            await unclaimRequest(id, eventId)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Backpack className="w-6 h-6 text-primary" />
                Mitbringliste & Wünsche
            </h3>

            {/* Input Area */}
            <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex gap-2 mb-1 flex-wrap">
                    <Button
                        variant={mode === 'custom' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('custom')}
                        className="rounded-full text-xs"
                    >
                        <Package className="w-3 h-3 mr-2" />
                        Ich bringe mit
                    </Button>
                    <Button
                        variant={mode === 'inventory' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('inventory')}
                        className="rounded-full text-xs"
                    >
                        <Gamepad2 className="w-3 h-3 mr-2" />
                        Aus Sammlung
                    </Button>
                    <Button
                        variant={mode === 'request' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('request')}
                        className="rounded-full text-xs bg-amber-100 text-amber-900 hover:bg-amber-200 data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                        data-state={mode === 'request' ? 'active' : 'inactive'}
                    >
                        <MessageCircleQuestion className="w-3 h-3 mr-2" />
                        Ich benötige...
                    </Button>
                </div>

                <div className="flex gap-2">
                    {mode === 'inventory' ? (
                        <Select value={selectedGame} onValueChange={setSelectedGame}>
                            <SelectTrigger className="bg-white rounded-xl shadow-sm w-full">
                                <SelectValue placeholder="Spiel auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {myInventory.length > 0 ? (
                                    myInventory.map((game) => (
                                        <SelectItem key={game.id} value={game.id}>
                                            {game.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-slate-500">Keine Spiele in deiner Sammlung.</div>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            placeholder={mode === 'request' ? "Was wird benötigt? (z.B. Grillkohle)" : "Z.B. Chips, Cola..."}
                            value={customItem}
                            onChange={(e) => setCustomItem(e.target.value)}
                            className="bg-white rounded-xl shadow-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || (mode === 'inventory' ? !selectedGame : !customItem)}
                        className={`rounded-xl shadow-lg transition-all ${mode === 'request' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200' : 'bg-primary hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        {mode === 'request' ? 'Anfragen' : <Plus className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Requests Column */}
                <div className="bg-amber-50/50 rounded-3xl p-4 md:p-6 border border-amber-100 min-h-[200px]">
                    <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageCircleQuestion className="w-4 h-4" /> Offene Anfragen
                    </h4>

                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-amber-300 italic text-sm">
                            Keine offenen Wünsche. Alles da!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map(req => {
                                const isClaimedByMe = req.claimed_by === userId
                                const isMyRequest = req.user_id === userId
                                const isClaimed = !!req.claimed_by

                                return (
                                    <div key={req.id} className={`p-3 rounded-xl border transition-all ${isClaimed ? 'bg-green-50 border-green-200' : 'bg-white border-amber-200 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{req.custom_item}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                    Von {req.profiles?.full_name}
                                                </p>
                                            </div>
                                            {(isMyRequest || isClaimedByMe) && (
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => handleDelete(req.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>

                                        {isClaimed ? (
                                            <div className="flex items-center justify-between bg-white/50 p-2 rounded-lg mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6 border border-green-200">
                                                        <AvatarImage src={req.claimer?.avatar_url} />
                                                        <AvatarFallback className="bg-green-100 text-green-700 text-[9px] font-black">{req.claimer?.full_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-bold text-green-700">Übernommen</span>
                                                </div>
                                                {isClaimedByMe && (
                                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-slate-400 hover:text-slate-700" onClick={() => handleUnclaim(req.id)}>
                                                        Zurückgeben
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="w-full h-8 mt-2 text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 shadow-none"
                                                onClick={() => handleClaim(req.id)}
                                                disabled={loading}
                                            >
                                                <Hand className="w-3 h-3 mr-2" /> Übernehmen
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Brings Column */}
                <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
                        <Package className="w-4 h-4" /> Mitgebracht
                    </h4>
                    {activeBrings.length === 0 && <p className="text-center text-slate-300 italic py-4">Noch bringt niemand etwas mit.</p>}

                    {activeBrings.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                                    {item.profiles?.full_name?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm line-clamp-1">
                                        {item.inventory?.name || item.custom_item}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                        Von {item.profiles?.full_name}
                                    </p>
                                </div>
                            </div>
                            {item.user_id === userId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
