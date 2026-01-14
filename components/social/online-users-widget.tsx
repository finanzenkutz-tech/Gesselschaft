'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Circle, Users, Swords, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { sendBuddyRequest } from '@/app/profile/buddy-actions'

import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

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

    useEffect(() => {
        const updateAndFetch = async () => {
            // Update current user's last_seen (heartbeat is also in Shell, but good to have here too)
            if (currentUserId) {
                await supabase
                    .from('profiles')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', currentUserId)
            }

            // Fetch online users (seen in last 60 minutes)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, last_seen')
                .gte('last_seen', oneHourAgo)
                .order('last_seen', { ascending: false })

            if (data) {
                setOnlineUsers(data.filter(u => u.id !== currentUserId))
            }
        }

        updateAndFetch()
        const interval = setInterval(updateAndFetch, 30000)
        return () => clearInterval(interval)
    }, [currentUserId, supabase])

    const isOnline = (lastSeen: string) => {
        const diff = Date.now() - new Date(lastSeen).getTime()
        return diff < 1000 * 60 * 3 // 3 minutes
    }

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
                    {onlineUsers.map(user => {
                        const active = isOnline(user.last_seen)
                        return (
                            <div key={user.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border-2",
                                            active ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-50 text-slate-400 border-slate-100"
                                        )}>
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user.full_name?.[0] || '?'
                                            )}
                                        </div>
                                        {active && <Circle className="w-3 h-3 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{user.full_name || 'Spieler'}</p>
                                        <p className={cn("text-[10px] font-medium uppercase tracking-wider", active ? "text-green-500" : "text-slate-400")}>
                                            {active ? 'Gerade Online' : `Aktiv ${formatDistanceToNow(new Date(user.last_seen), { addSuffix: true, locale: de })}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/challenge?opponent=${user.id}`}>
                                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-white text-xs h-8">
                                            <Swords className="w-3 h-3 mr-1" />
                                            Fordern
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
