'use client'

import { useState, useEffect, useRef, useOptimistic, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/events/chat-actions'
import { MessageCircle, Send, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Message = {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        full_name: string | null
        email: string
    }
}

export function EventChatWidget({ eventId, initialMessages, userId }: { eventId: string, initialMessages: Message[], userId?: string }) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [inputValue, setInputValue] = useState('')
    const [isPending, startTransition] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Subscribe to real-time updates
    useEffect(() => {
        const channel = supabase
            .channel(`event-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'event_messages',
                    filter: `event_id=eq.${eventId}`
                },
                async (payload) => {
                    // Fetch profile for new message
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', payload.new.user_id)
                        .single()

                    const newMessage: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        user_id: payload.new.user_id,
                        profiles: profile || { full_name: null, email: 'Unknown' }
                    }

                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === newMessage.id)) return prev
                        return [...prev, newMessage]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventId, supabase])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!inputValue.trim() || !userId) return

        const formData = new FormData()
        formData.append('event_id', eventId)
        formData.append('content', inputValue)

        setInputValue('')

        startTransition(async () => {
            await sendMessage(formData)
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <section className="sky-card p-0 overflow-hidden flex flex-col h-[400px]">
            <div className="bg-gradient-to-r from-primary to-blue-600 p-4 text-white flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                <h2 className="font-bold">Event Chat</h2>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">{messages.length} Nachrichten</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        <div className="text-center">
                            <Smile className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>Noch keine Nachrichten. Starte die Unterhaltung!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.user_id === userId
                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                                    {!isOwn && (
                                        <p className="text-xs text-slate-400 font-bold mb-1 ml-1">
                                            {msg.profiles?.full_name || msg.profiles?.email?.split('@')[0]}
                                        </p>
                                    )}
                                    <div className={`p-3 rounded-2xl ${isOwn ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm shadow-sm'}`}>
                                        <p className="text-sm font-medium">{msg.content}</p>
                                    </div>
                                    <p className={`text-[10px] text-slate-400 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                                        {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Nachricht schreiben..."
                    className="flex-1 rounded-xl border-slate-200 focus:border-primary h-12"
                    disabled={!userId || isPending}
                />
                <Button
                    type="submit"
                    disabled={!inputValue.trim() || !userId || isPending}
                    className="bg-primary hover:bg-blue-600 text-white rounded-xl h-12 w-12 p-0"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </form>
        </section>
    )
}
