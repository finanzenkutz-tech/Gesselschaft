'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getGroupMessages, sendGroupMessage, deleteGroupMessage } from '@/app/(app)/chat/actions'
import { Send, MessageSquare, Loader2, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { MuteUserButton } from '@/components/chat/mute-user-button'
import { getMutedUsers } from '@/app/(app)/settings/user-settings-actions'

type Message = {
    id: string
    user_id: string
    content: string
    created_at: string
    profiles?: {
        full_name: string
        avatar_url: string
    } | null
}

export function GroupChatWidget({ groupId, user }: { groupId: string, user: any }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [mutedUserIds, setMutedUserIds] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true)
            try {
                const [msgs, mutedUsers] = await Promise.all([
                    getGroupMessages(groupId),
                    getMutedUsers()
                ])
                setMessages(msgs || [])
                setMutedUserIds(mutedUsers.map((u: any) => u.id))
            } catch (err) {
                console.error('Error in GroupChatWidget:', err)
            } finally {
                setLoading(false)
                scrollToBottom()
            }
        }
        loadMessages()

        const channel = supabase
            .channel(`group-chat-${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Fetch profile for the new message
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('id', payload.new.user_id)
                            .single()

                        const newMsg = {
                            ...payload.new as Message,
                            profiles: profile
                        }
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev
                            return [...prev, newMsg]
                        })
                        scrollToBottom()
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [groupId, supabase])

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        const content = newMessage.trim()
        setNewMessage('')
        setSending(true)

        const result = await sendGroupMessage(groupId, content)
        if (!result.success) {
            console.error('Error sending message:', result.error)
            setNewMessage(content) // Restore message on error
        }
        // Result is handled by realtime subscription
        setSending(false)
    }

    const handleDelete = async (messageId: string) => {
        if (!confirm('Nachricht wirklich löschen?')) return
        const result = await deleteGroupMessage(messageId)
        if (!result.success) {
            alert('Löschen fehlgeschlagen: ' + result.error)
        }
        // Result is handled by realtime subscription
    }

    return (
        <div className="sky-card flex flex-col h-[500px] overflow-hidden bg-white/80 backdrop-blur-md border border-white/50 shadow-xl rounded-[2.5rem]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100/50 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 tracking-tight">Gruppenchat</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Unterhaltung</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-primary animate-spin opacity-20" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center opacity-50">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-600">Noch keine Nachrichten</p>
                            <p className="text-xs">Schreibe die erste Nachricht an deine Gruppe!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg, idx) => {
                            const isMe = msg.user_id === user?.id
                            const isMuted = mutedUserIds.includes(msg.user_id)
                            const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id

                            return (
                                <div key={msg.id} className={cn(
                                    "flex gap-3 max-w-[85%] group/msg",
                                    isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                                    isMuted && !isMe && "opacity-40 grayscale"
                                )}>
                                    <div className={cn("w-8 h-8 shrink-0", !showAvatar && "invisible")}>
                                        <Avatar className="w-8 h-8 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                            <AvatarImage src={msg.profiles?.avatar_url} />
                                            <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-400">
                                                {msg.profiles?.full_name?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className={cn("flex flex-col gap-1.5 min-w-0", isMe ? "items-end" : "items-start")}>
                                        {showAvatar && (
                                            <div className="flex items-center gap-2 px-1">
                                                {!isMe && (
                                                    <>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{msg.profiles?.full_name}</span>
                                                        <MuteUserButton
                                                            targetUserId={msg.user_id}
                                                            targetUserName={msg.profiles?.full_name || 'Unbekannt'}
                                                            initialIsMuted={isMuted}
                                                            className="p-0 h-4 w-4"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <div className="relative group/msg-content">
                                            <div className={cn(
                                                "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm break-words transition-all hover:shadow-md",
                                                isMe
                                                    ? "bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-none"
                                                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                            )}>
                                                {msg.content}
                                            </div>

                                            {isMe && (
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/msg-content:opacity-100 transition-all"
                                                    title="Löschen"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-300 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                            {mounted ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: de }) : '...'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 bg-white/50 border-t border-slate-100/50">
                <div className="flex gap-2 p-1 bg-slate-50 rounded-[1.5rem] border border-slate-200 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30 transition-all">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nachricht an die Gruppe..."
                        className="border-none bg-transparent shadow-none focus-visible:ring-0 h-12 px-4 font-medium placeholder:text-slate-400"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                        className={cn(
                            "h-12 w-12 rounded-2xl shrink-0 transition-all",
                            newMessage.trim() ? "bg-primary text-white shadow-lg hover:scale-105 active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </div>
            </form>
        </div>
    )
}
