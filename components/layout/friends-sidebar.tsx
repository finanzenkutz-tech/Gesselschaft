'use client'

import { useEffect, useState } from 'react'
import { getBuddies } from '@/app/(app)/profile/buddy-actions'
import { getMyDirectChats } from '@/app/(app)/chat/direct-actions'
import { getUserGroups } from '@/app/(app)/chat/actions'
import { User, MessageCircle, MoreVertical, MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function FriendsSidebar({ currentUserId }: { currentUserId: string }) {
    const [buddies, setBuddies] = useState<any[]>([])
    const [chats, setChats] = useState<any[]>([])
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [buddiesData, chatsData, groupsData] = await Promise.all([
                    getBuddies(),
                    getMyDirectChats(),
                    getUserGroups()
                ])
                setBuddies(buddiesData || [])
                setChats(chatsData || [])
                setGroups(groupsData || [])
            } catch (err) {
                console.error('Error fetching sidebar data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return (
        <div className="space-y-4 py-4 px-4">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-4" />
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
                </div>
            ))}
        </div>
    )

    const hasContent = buddies.length > 0 || chats.length > 0 || groups.length > 0
    if (!hasContent) return null

    return (
        <div className="space-y-6 py-4 border-t border-slate-50 mt-4">
            {/* Active Chats & Groups */}
            {(chats.length > 0 || groups.length > 0) && (
                <div className="space-y-4">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageCircle className="w-3 h-3" />
                        Letzte Nachrichten
                    </p>
                    <div className="space-y-1">
                        {/* Group Chats */}
                        {groups.map((g) => (
                            <div key={g.id} className="group relative flex items-center gap-3 px-4 py-2 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer">
                                <Link href={`/chat?group=${g.id}`} className="absolute inset-0 z-10" />
                                <div className="w-8 h-8 rounded-lg bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-sm">
                                    {g.emoji || '🎲'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{g.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">Gruppenchat</p>
                                </div>
                            </div>
                        ))}

                        {/* Direct Chats */}
                        {chats.map((c) => {
                            const profile = c.profiles
                            if (!profile) return null
                            const isOnline = profile.last_seen && new Date(profile.last_seen).getTime() > Date.now() - 60000

                            return (
                                <div key={c.chat_id} className="group relative flex items-center gap-3 px-4 py-2 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer">
                                    <Link href={`/chat?type=direct&id=${c.chat_id}`} className="absolute inset-0 z-10" />
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-primary">{profile.full_name?.[0] || '?'}</span>
                                            )}
                                        </div>
                                        {isOnline && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{profile.full_name || 'User'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
                                            {isOnline ? 'Gerade online' : 'Chat'}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Buddies (who might not have a chat yet) */}
            {buddies.length > 0 && (
                <div className="space-y-2">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Deine Buddies
                    </p>
                    <div className="space-y-1">
                        {buddies.filter(b => {
                            const buddyId = b.user_id === currentUserId ? b.buddy_id : b.user_id
                            return !chats.some(c => c.profiles?.id === buddyId)
                        }).map((b) => {
                            const buddyProfile = b.user_id === currentUserId ? b.buddy : b.user
                            if (!buddyProfile) return null
                            const isOnline = buddyProfile.last_seen && new Date(buddyProfile.last_seen).getTime() > Date.now() - 60000

                            return (
                                <div key={b.id} className="group relative flex items-center gap-3 px-4 py-2 hover:bg-slate-50/50 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100">
                                    <Link href={`/chat/new/${buddyProfile.id}`} className="absolute inset-0 z-10" />
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                            {buddyProfile.avatar_url ? (
                                                <img src={buddyProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400">{buddyProfile.full_name?.[0] || '?'}</span>
                                            )}
                                        </div>
                                        {isOnline && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{buddyProfile.full_name || 'User'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
                                            {isOnline ? 'Online' : 'Nicht im Chat'}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

