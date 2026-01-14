'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { markAsRead, markAllAsRead, getNotifications } from '@/app/notifications/actions'
import Link from 'next/link'

export function NotificationBell({ userId }: { userId?: string }) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        const fetchNotifications = async () => {
            const data = await getNotifications()
            setNotifications(data)
            setUnreadCount(data.filter((n: any) => !n.is_read).length)
        }

        fetchNotifications()

        // Realtime subscription
        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

    async function handleMarkRead(id: string) {
        await markAsRead(id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    async function handleMarkAllRead() {
        await markAllAsRead()
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="relative p-2 text-slate-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-xl">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white mt-2" align="end">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white flex items-center justify-between">
                    <h3 className="font-extrabold text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Benachrichtigungen
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-100"
                        >
                            Alle lesen
                        </button>
                    )}
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="font-medium">Keine Benachrichtigungen</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-4 rounded-2xl mb-2 transition-all relative group ${n.is_read ? 'opacity-60' : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-50'}`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 text-sm">{n.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                                        {n.link && (
                                            <Link
                                                href={n.link}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mt-2 uppercase tracking-wider hover:underline"
                                            >
                                                Details <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            onClick={() => handleMarkRead(n.id)}
                                            className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all scale-0 group-hover:scale-100"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <span className="text-[9px] text-slate-300 mt-2 block italic">
                                    {new Date(n.created_at).toLocaleDateString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
