'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, getMessages, DirectMessage, getChatPartner } from '@/app/chat/actions'
import { Send, ArrowLeft, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

type ChatPartner = {
    id: string
    full_name: string | null
    avatar_url: string | null
    last_seen: string | null
}

export function ChatWindow({ partnerId, currentUserId }: { partnerId: string, currentUserId: string }) {
    const [messages, setMessages] = useState<DirectMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [partner, setPartner] = useState<ChatPartner | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Load initial messages and partner info
    useEffect(() => {
        const loadData = async () => {
            const [msgs, partnerData] = await Promise.all([
                getMessages(partnerId),
                getChatPartner(partnerId)
            ])
            setMessages(msgs)
            setPartner(partnerData)
        }
        loadData()
    }, [partnerId])

    // Subscribe to new messages in realtime
    useEffect(() => {
        const channel = supabase
            .channel('direct-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `or(and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}))`
                },
                (payload) => {
                    const newMsg = payload.new as DirectMessage
                    setMessages(prev => [...prev, newMsg])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partnerId, currentUserId, supabase])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        const result = await sendMessage(partnerId, newMessage)
        if (result.success) {
            setNewMessage('')
        }
        setSending(false)
    }

    const isOnline = partner?.last_seen
        ? new Date(partner.last_seen).getTime() > Date.now() - 5 * 60 * 1000
        : false

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
            {/* Chat Header */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-white rounded-t-2xl">
                <Link href="/chat" className="lg:hidden">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {partner?.avatar_url ? (
                            <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            partner?.full_name?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                    <Circle
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${isOnline ? 'text-green-500 fill-green-500' : 'text-slate-300 fill-slate-300'}`}
                    />
                </div>
                <div className="flex-1">
                    <h2 className="font-bold text-slate-800">{partner?.full_name || 'Unbekannt'}</h2>
                    <p className="text-xs text-slate-400">
                        {isOnline ? '🟢 Online' : partner?.last_seen
                            ? `Zuletzt online ${formatDistanceToNow(new Date(partner.last_seen), { addSuffix: true, locale: de })}`
                            : 'Offline'
                        }
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-center">
                        <div>
                            <p className="text-lg font-medium">Noch keine Nachrichten</p>
                            <p className="text-sm">Schreibe die erste Nachricht! 👋</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === currentUserId
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${isOwn
                                            ? 'bg-primary text-white rounded-br-md'
                                            : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: de })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nachricht schreiben..."
                        className="flex-1 rounded-xl bg-slate-50 border-slate-100 h-12"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-primary hover:bg-blue-600 text-white rounded-xl h-12 w-12 p-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </form>
        </div>
    )
}
