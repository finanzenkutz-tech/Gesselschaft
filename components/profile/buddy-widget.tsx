'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Check, X, UserMinus, Clock, Search, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { acceptBuddyRequest, rejectBuddyRequest, searchProfiles, sendBuddyRequest } from '@/app/(app)/profile/buddy-actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

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
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true)
                const results = await searchProfiles(searchQuery)
                setSearchResults(results)
                setIsSearching(false)
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])

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

    async function handleSendRequest(buddyId: string) {
        setLoading(buddyId)
        const res = await sendBuddyRequest(buddyId)
        if (res.success) {
            // Update local state to show "Gesendet"
            setSearchResults(prev => prev.map(p =>
                p.id === buddyId ? { ...p, relationship: { status: 'pending', user_id: currentUserId } } : p
            ))
        }
        setLoading(null)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Search Section */}
            <section className="sky-card p-8 bg-gradient-to-br from-white to-blue-50/20">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3 mb-6">
                    <UserPlus className="w-6 h-6 text-primary" />
                    Buddies finden
                </h3>
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <Input
                        placeholder="Name eines Spielers suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-white border-slate-100 shadow-sm focus:ring-primary/20 transition-all text-lg"
                    />
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                    )}
                </div>

                {searchResults.length > 0 && (
                    <div className="grid gap-3 animate-in fade-in zoom-in-95 duration-200">
                        {searchResults.map((user) => {
                            const isPending = user.relationship?.status === 'pending'
                            const isAccepted = user.relationship?.status === 'accepted'
                            const isSender = user.relationship?.user_id === currentUserId

                            return (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center font-black text-primary text-xl border border-blue-100 shadow-inner">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                user.full_name?.[0] || '?'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800">{user.full_name}</p>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                <span>{user.points || 0} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAccepted ? (
                                            <Badge className="bg-green-100 text-green-600 border-green-200 px-3 py-1.5 rounded-xl font-bold">
                                                <Check className="w-4 h-4 mr-1" /> Buddy
                                            </Badge>
                                        ) : isPending ? (
                                            <Button disabled variant="secondary" className="bg-slate-50 text-slate-400 border border-slate-100 rounded-xl font-bold h-10">
                                                {isSender ? 'Anfrage gesendet' : 'Anfrage erhalten'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleSendRequest(user.id)}
                                                disabled={loading === user.id}
                                                className="bg-primary hover:bg-blue-600 text-white rounded-xl h-10 px-5 font-bold shadow-md shadow-blue-100 active:scale-95 transition-all"
                                            >
                                                {loading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                                Hinzufügen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-8 text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                        Keine Spieler mit "{searchQuery}" gefunden.
                    </div>
                )}
            </section>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <section className="sky-card p-8 border-2 border-primary/20 bg-blue-50/30">
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3 mb-6">
                        <Clock className="w-6 h-6 text-primary animate-pulse" />
                        Offene Anfragen
                    </h3>
                    <div className="grid gap-4">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-blue-50 group hover:border-primary/50 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-primary border-2 border-white shadow-sm overflow-hidden text-xl">
                                        {req.sender?.avatar_url ? (
                                            <img src={req.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            req.sender?.full_name?.[0] || '?'
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800">{req.sender?.full_name || 'Anonymer Spieler'}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Möchte dein Buddy werden</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={loading === req.id}
                                        className="bg-primary hover:bg-blue-600 text-white rounded-xl h-10 px-5 font-black shadow-lg shadow-blue-100 active:scale-95 transition-all"
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Annehmen
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleReject(req.id)}
                                        disabled={loading === req.id}
                                        className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl h-10 px-4 font-bold active:scale-95 transition-all"
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
                <header className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                        <Users className="w-6 h-6 text-secondary" />
                        Meine Buddies
                    </h3>
                    <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider border border-slate-200/50">
                        {buddies.length} Verbunden
                    </span>
                </header>

                {buddies.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <UserPlus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Noch keine Buddies hinzugefügt.</p>
                        <p className="text-xs text-slate-300 mt-2 font-medium">Nutze die Suche oben, um deine Mitspieler zu finden!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {buddies.map((b) => {
                            const buddyProfile = b.user_id === currentUserId ? b.buddy : b.user
                            return (
                                <div key={b.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-secondary/30 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-secondary flex items-center justify-center font-black border border-indigo-100 shadow-inner text-xl overflow-hidden">
                                            {buddyProfile?.avatar_url ? (
                                                <img src={buddyProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                buddyProfile?.full_name?.[0] || '?'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800">{buddyProfile?.full_name || 'Buddy'}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-green-500 font-black uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">Verbunden</span>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    {buddyProfile?.points || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReject(b.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl w-10 h-10 p-0"
                                    >
                                        <UserMinus className="w-5 h-5" />
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

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", className)}>
            {children}
        </span>
    )
}
