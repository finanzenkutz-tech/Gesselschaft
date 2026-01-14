'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Circle, Users, Swords, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { sendBuddyRequest } from '@/app/profile/buddy-actions'

type OnlineUser = {
    id: string
    full_name: string | null
    avatar_url: string | null
    last_seen: string
}

export function OnlineUsersWidget({ currentUserId }: { currentUserId?: string }) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [expanded, setExpanded] = useState(false)
    const supabase = createClient()

    // Update current user's last_seen and fetch online users
    useEffect(() => {
        const updateAndFetch = async () => {
            // Update current user's last_seen
            if (currentUserId) {
                await supabase
                    .from('profiles')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', currentUserId)
            }

            // Fetch online users (seen in last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, last_seen')
                .gte('last_seen', fiveMinutesAgo)
                .order('last_seen', { ascending: false })

            if (data) {
                setOnlineUsers(data.filter(u => u.id !== currentUserId))
            }
        }

        updateAndFetch()

        // Refresh every 30 seconds
        const interval = setInterval(updateAndFetch, 30000)
        return () => clearInterval(interval)
    }, [currentUserId, supabase])

    if (onlineUsers.length === 0) return null

    return (
        <div className="sky-card p-8 transition-all hover:shadow-xl">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <div className="relative">
                        <Users className="w-5 h-5 text-green-500" />
                        <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                    </div>
                    Gerade Online ({onlineUsers.length})
                </h3>
                <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 3).map(user => (
                        <div
                            key={user.id}
                            className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-600 overflow-hidden"
                        >
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user.full_name?.[0] || '?'
                            )}
                        </div>
                    ))}
                    {onlineUsers.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                            +{onlineUsers.length - 3}
                        </div>
                    )}
                </div>
            </button>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                    {onlineUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-sm font-bold text-green-600 overflow-hidden border-2 border-green-200">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            user.full_name?.[0] || '?'
                                        )}
                                    </div>
                                    <Circle className="w-3 h-3 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{user.full_name || 'Anonym'}</p>
                                    <p className="text-xs text-green-500">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/challenge?opponent=${user.id}`}>
                                    <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-white text-xs">
                                        <Swords className="w-3 h-3 mr-1" />
                                        Fordern
                                    </Button>
                                </Link>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                        const res = await sendBuddyRequest(user.id)
                                        if (res.success) alert('Anfrage gesendet!')
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-slate-400 hover:text-secondary hover:bg-secondary/10 px-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
