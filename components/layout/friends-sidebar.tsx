'use client'

import { useEffect, useState } from 'react'
import { getBuddies } from '@/app/profile/buddy-actions'
import { User, MessageCircle, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function FriendsSidebar({ currentUserId }: { currentUserId: string }) {
    const [buddies, setBuddies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchBuddies() {
            try {
                const data = await getBuddies()
                setBuddies(data)
            } catch (err) {
                console.error('Error fetching buddies:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchBuddies()
    }, [])

    if (loading) return null

    if (buddies.length === 0) return null

    return (
        <div className="space-y-4 py-4 border-t border-slate-50 mt-4">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deine Buddies</p>
            <div className="space-y-1">
                {buddies.map((b) => {
                    const buddyProfile = b.user_id === currentUserId ? b.buddy : b.user
                    const isOnline = buddyProfile.last_seen && new Date(buddyProfile.last_seen).getTime() > Date.now() - 60000

                    return (
                        <div key={b.id} className="group relative flex items-center gap-3 px-4 py-2 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer">
                            <Link href={`/chat/${buddyProfile.id}`} className="absolute inset-0 z-10" />
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                    {buddyProfile.avatar_url ? (
                                        <img src={buddyProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-bold text-primary">{buddyProfile.full_name?.[0] || '?'}</span>
                                    )}
                                </div>
                                {isOnline && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 truncate">{buddyProfile.full_name || 'User'}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
                                    {isOnline ? 'Gerade online' : 'Offline'}
                                </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <MessageCircle className="w-4 h-4 text-slate-300 hover:text-primary" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
