'use client'

import { useState } from 'react'
import { Users, UserPlus, Check, X, UserMinus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptBuddyRequest, rejectBuddyRequest } from '@/app/profile/buddy-actions'
import { useRouter } from 'next/navigation'

export function BuddyWidget({
    buddies,
    pendingRequests,
    currentUserId
}: {
    buddies: any[],
    pendingRequests: any[],
    currentUserId: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    async function handleAccept(id: string) {
        setLoading(id)
        const res = await acceptBuddyRequest(id)
        if (res.success) router.refresh()
        setLoading(null)
    }

    async function handleReject(id: string) {
        setLoading(id)
        const res = await rejectBuddyRequest(id)
        if (res.success) router.refresh()
        setLoading(null)
    }

    return (
        <div className="space-y-8">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <section className="sky-card p-8 border-2 border-primary/20 bg-blue-50/30">
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3 mb-6">
                        <Clock className="w-6 h-6 text-primary animate-pulse" />
                        Offene Anfragen
                    </h3>
                    <div className="space-y-4">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary border-2 border-white">
                                        {req.sender?.full_name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{req.sender?.full_name || 'Anonymer Spieler'}</p>
                                        <p className="text-xs text-slate-400">Möchte dein Buddy werden</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={loading === req.id}
                                        className="bg-primary hover:bg-blue-600 text-white rounded-xl h-10 px-4 font-bold"
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Annehmen
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleReject(req.id)}
                                        disabled={loading === req.id}
                                        className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl h-10 px-4 font-bold"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Buddies List */}
            <section className="sky-card p-8">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-secondary" />
                    Meine Buddies
                </h3>

                {buddies.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <UserPlus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Noch keine Buddies hinzugefügt.</p>
                        <p className="text-xs text-slate-300 mt-1">Herausforderer auf dem Dashboard können deine Freunde werden!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {buddies.map((b) => {
                            const buddyProfile = b.user_id === currentUserId ? b.buddy : b.user
                            return (
                                <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-secondary flex items-center justify-center font-bold border border-blue-100">
                                            {buddyProfile?.full_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{buddyProfile?.full_name || 'Buddy'}</p>
                                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Verbunden</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReject(b.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 rounded-xl"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
