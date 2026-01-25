'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, MessageSquare, Loader2, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendMessage, deleteMessage } from '@/app/(app)/events/chat-actions'
import { useRouter } from 'next/navigation'
import { MuteUserButton } from '@/components/chat/mute-user-button'

type Message = {
    id: string
    content: string
    created_at: string
    user_id: string
    user: {
        full_name: string | null
        avatar_url: string | null
    }
}

export function EventChatWidget({
    eventId,
    initialMessages,
    userId,
    initialMutedUserIds = []
}: {
    eventId: string,
    initialMessages: Message[],
    userId?: string,
    initialMutedUserIds?: string[]
}) {
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [mutedIds, setMutedIds] = useState<string[]>(initialMutedUserIds)
    const [revealedIds, setRevealedIds] = useState<string[]>([])
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on mount or new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [initialMessages.length])

    async function handleSend() {
        if (!newMessage.trim()) return
        setIsSending(true)

        const result = await sendMessage(eventId, newMessage)

        setIsSending(false)
        if (result.success) {
            setNewMessage('')
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    async function handleDelete(messageId: string) {
        if (!confirm('Nachricht löschen?')) return
        const result = await deleteMessage(messageId, eventId)
        if (result.success) {
            router.refresh()
        }
    }

    const msgList = initialMessages.map(msg => {
        const isMe = msg.user_id === userId
        const isMuted = mutedIds.includes(msg.user_id) && !isMe
        const isRevealed = revealedIds.includes(msg.id)

        return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300 ${isMuted && !isRevealed ? 'opacity-40 grayscale' : ''}`}>
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm overflow-hidden shrink-0 border border-slate-100 ring-4 ring-slate-50 relative">
                    {msg.user?.avatar_url ? (
                        <img src={msg.user.avatar_url} alt={msg.user.full_name || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary text-sm font-black bg-blue-50">
                            {msg.user?.full_name?.[0] || '?'}
                        </div>
                    )}
                </div>

                <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 px-1">
                        {!isMe && (
                            <MuteUserButton
                                targetUserId={msg.user_id}
                                targetUserName={msg.user?.full_name || 'Unbekannt'}
                                initialIsMuted={mutedIds.includes(msg.user_id)}
                                className="p-0 hover:bg-transparent -mt-1"
                            />
                        )}
                        <span>{msg.user?.full_name || 'Unbekannt'}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {isMuted && !isRevealed ? (
                        <button
                            onClick={() => setRevealedIds(prev => [...prev, msg.id])}
                            className="flex items-center gap-2 p-3 bg-slate-200/50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                            <EyeOff className="w-3 h-3" />
                            Nachricht von stummgeschaltetem Nutzer anzeigen
                        </button>
                    ) : (
                        <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed relative group ${isMe
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                            }`}>
                            <p className="whitespace-pre-wrap font-medium">{msg.content}</p>

                            {isMe && (
                                <button
                                    onClick={() => handleDelete(msg.id)}
                                    title="Nachricht löschen"
                                    aria-label="Nachricht löschen"
                                    className="absolute -left-10 top-0 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    })

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-3">
                    <MessageSquare className="w-6 h-6" />
                    Event Chat
                </h3>
                <span className="text-xs font-black bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full shadow-sm border border-white/10 uppercase tracking-widest">
                    {initialMessages.length} Nachrichten
                </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {initialMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-60">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold">Noch keine Nachrichten.</p>
                            <p className="text-sm">Schreib als Erster!</p>
                        </div>
                    </div>
                ) : msgList}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:border-blue-300 transition-colors">
                    <Textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Nachricht schreiben..."
                        className="min-h-[44px] max-h-[150px] resize-none border-none bg-transparent focus-visible:ring-0 rounded-xl py-2 px-3 text-slate-700 font-medium placeholder:text-slate-400"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !newMessage.trim()}
                        className="h-[44px] w-[44px] rounded-xl bg-blue-500 hover:bg-blue-600 shadow-blue-200 shadow-lg p-0 shrink-0 self-end transition-all hover:scale-105 active:scale-95"
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}

