'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, Loader2, Check, User as UserIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchProfiles, sendBuddyRequest } from '@/app/(app)/profile/buddy-actions'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { cn } from '@/lib/utils'

export function UserSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [requestingId, setRequestingId] = useState<string | null>(null)

    const debouncedQuery = useDebounce(query, 500)

    useEffect(() => {
        async function fetchResults() {
            if (debouncedQuery.length < 2) {
                setResults([])
                return
            }
            setLoading(true)
            const profiles = await searchProfiles(debouncedQuery)
            setResults(profiles)
            setLoading(false)
        }
        fetchResults()
    }, [debouncedQuery])

    async function handleAddFriend(userId: string) {
        setRequestingId(userId)
        const result = await sendBuddyRequest(userId)
        if (result.success) {
            // Update local state to show pending
            setResults(prev => prev.map(p =>
                p.id === userId ? { ...p, relationship: { status: 'pending', user_id: 'self' } } : p
            ))
        } else {
            alert(result.error)
        }
        setRequestingId(null)
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Nach Spielern suchen..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 rounded-xl bg-slate-50 border-slate-100"
                />
            </div>

            {loading && (
                <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {results.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{profile.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profile.points || 0} XP</p>
                                </div>
                            </div>

                            {profile.relationship ? (
                                <div className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
                                    profile.relationship.status === 'accepted'
                                        ? "bg-green-50 text-green-600 border border-green-100"
                                        : "bg-slate-50 text-slate-400 border border-slate-100"
                                )}>
                                    {profile.relationship.status === 'accepted' ? (
                                        <><Check className="w-3 h-3" /> Buddy</>
                                    ) : (
                                        "Anfrage offen"
                                    )}
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    className="rounded-xl h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                                    onClick={() => handleAddFriend(profile.id)}
                                    disabled={requestingId === profile.id}
                                >
                                    {requestingId === profile.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <><UserPlus className="w-3 h-3 mr-2" /> Add</>
                                    )}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">Keine Spieler gefunden.</p>
            )}
        </div>
    )
}
