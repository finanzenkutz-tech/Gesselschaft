'use client'

import Link from 'next/link'
import { Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type Conversation = {
    partnerId: string
    lastMessage: string
    lastMessageAt: string
    unread: boolean
    partner: {
        id: string
        full_name: string | null
        avatar_url: string | null
        last_seen: string | null
    } | null
}

export function ConversationList({
    conversations,
    activePartnerId
}: {
    conversations: Conversation[]
    activePartnerId?: string
}) {
    if (conversations.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400">
                <p className="text-lg font-medium mb-2">Keine Chats</p>
                <p className="text-sm">Starte einen Chat über das Buddy-Widget!</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-slate-50">
            {conversations.map((conv) => {
                const isOnline = conv.partner?.last_seen
                    ? new Date(conv.partner.last_seen).getTime() > Date.now() - 5 * 60 * 1000
                    : false

                return (
                    <Link
                        key={conv.partnerId}
                        href={`/chat/${conv.partnerId}`}
                        className={cn(
                            "flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors",
                            activePartnerId === conv.partnerId && "bg-blue-50 border-l-4 border-primary"
                        )}
                    >
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                {conv.partner?.avatar_url ? (
                                    <img src={conv.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    conv.partner?.full_name?.[0]?.toUpperCase() || '?'
                                )}
                            </div>
                            <Circle
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${isOnline ? 'text-green-500 fill-green-500' : 'text-slate-300 fill-slate-300'}`}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 truncate">
                                    {conv.partner?.full_name || 'Unbekannt'}
                                </h3>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: de })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={cn(
                                    "text-sm truncate",
                                    conv.unread ? "text-slate-800 font-medium" : "text-slate-400"
                                )}>
                                    {conv.lastMessage}
                                </p>
                                {conv.unread && (
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
