'use client'

import { useState } from 'react'
import { ShoppingBasket, Plus, Check, Trash2, User, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addContribution, claimContribution, releaseContribution, deleteContribution } from '@/app/events/contribution-actions'
import { useRouter } from 'next/navigation'

type Contribution = {
    id: string
    item_name: string
    user_id: string | null
    status: 'open' | 'claimed'
}

export function EventContributionsWidget({
    eventId,
    contributions,
    userId
}: {
    eventId: string
    contributions: any[]
    userId?: string
}) {
    const [newItem, setNewItem] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleAdd() {
        if (!newItem.trim()) return
        setLoading(true)
        const res = await addContribution(eventId, newItem)
        if (res.success) {
            setNewItem('')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleClaim(id: string) {
        const res = await claimContribution(id, eventId)
        if (res.success) router.refresh()
    }

    async function handleRelease(id: string) {
        const res = await releaseContribution(id, eventId)
        if (res.success) router.refresh()
    }

    async function handleDelete(id: string) {
        const res = await deleteContribution(id, eventId)
        if (res.success) router.refresh()
    }

    return (
        <section className="sky-card p-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <ShoppingBasket className="w-7 h-7 text-orange-500" />
                Mitbringliste
            </h2>

            <div className="flex gap-2">
                <Input
                    placeholder="Z.B. Chips, Cola, Pizza..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="rounded-xl bg-slate-50 border-slate-100"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button
                    onClick={handleAdd}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-100"
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            <div className="space-y-3">
                {contributions.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 italic">Noch nichts auf der Liste.</p>
                ) : (
                    contributions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group transition-all hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'claimed' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                                    {item.status === 'claimed' ? <Check className="w-5 h-5" /> : <ShoppingBasket className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`font-bold ${item.status === 'claimed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {item.item_name}
                                    </p>
                                    {item.status === 'claimed' && (
                                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                                            Wird mitgebracht
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {item.status === 'open' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleClaim(item.id)}
                                        className="rounded-lg border-orange-200 text-orange-500 hover:bg-orange-50"
                                    >
                                        Ich bring's mit
                                    </Button>
                                ) : (
                                    item.user_id === userId ? (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRelease(item.id)}
                                            className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                            title="Zusage zurückziehen"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </Button>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )
                                )}

                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
