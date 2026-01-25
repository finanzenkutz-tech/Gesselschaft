'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getGroupMessages, sendGroupMessage } from './actions'
import { getDirectMessages, sendDirectMessage } from './direct-actions'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, MessageSquare, Loader2, MoreVertical, User } from 'lucide-react'
import { format } from 'date-fns'
import { useSearchParams } from 'next/navigation'

type Message = {
    id: string
    user_id: string
    content: string
    created_at: string
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

type Group = {
    id: string
    name: string
    emoji: string
}

type DirectChat = {
    chat_id: string
    profiles: {
        id: string
        full_name: string
        avatar_url: string
    }
}

export function ChatInterface({ user, groups, directChats = [] }: { user: any, groups: Group[], directChats?: DirectChat[] }) {
    const searchParams = useSearchParams()
    const initialDmId = searchParams.get('dm')

    const allChats = [
        ...groups.map(g => ({ id: g.id, name: g.name, type: 'group' as const, icon: g.emoji, avatarUrl: null })),
        ...directChats.map(d => ({ id: d.chat_id, name: d.profiles.full_name, type: 'dm' as const, icon: null, avatarUrl: d.profiles.avatar_url }))
    ]

    const [selectedChatId, setSelectedChatId] = useState<string | null>(() => {
        if (initialDmId && allChats.find(c => c.id === initialDmId)) return initialDmId
        if (groups.length > 0) return groups[0].id
        if (directChats.length > 0) return directChats[0].chat_id
        return null
    })

    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

    const selectedChat = allChats.find(c => c.id === selectedChatId)

    useEffect(() => {
        if (!selectedChatId) return

        if (window.innerWidth < 768) {
            setMobileView('chat')
        }

        async function load() {
            setLoading(true)
            let msgs: any[] = []

            if (selectedChat?.type === 'group') {
                msgs = await getGroupMessages(selectedChatId!)
            } else if (selectedChat?.type === 'dm') {
                const res = await getDirectMessages(selectedChatId!)
                // Map sender_id to user_id for consistency
                msgs = (res || []).map((m: any) => ({
                    ...m,
                    user_id: m.sender_id,
                    profiles: m.sender // direct-actions returns sender as profiles alias usually, check action
                }))
            }

            setMessages(msgs || [])
            setLoading(false)
            scrollToBottom()
        }
        load()

        // Realtime
        let channel: any;

        if (selectedChat?.type === 'group') {
            channel = supabase.channel(`chat:${selectedChatId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${selectedChatId}` },
                    async (payload) => {
                        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', payload.new.user_id).single()
                        setMessages(prev => [...prev, { ...payload.new as any, profiles: profile }])
                        scrollToBottom()
                    })
                .subscribe()
        } else if (selectedChat?.type === 'dm') {
            channel = supabase.channel(`dm:${selectedChatId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `chat_id=eq.${selectedChatId}` },
                    async (payload) => {
                        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', payload.new.sender_id).single()
                        setMessages(prev => [...prev, { ...payload.new as any, user_id: payload.new.sender_id, profiles: profile }])
                        scrollToBottom()
                    })
                .subscribe()
        }

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [selectedChatId, selectedChat?.type, supabase])

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        }, 100)
    }

    const handleSend = async () => {
        if (!inputText.trim() || !selectedChatId || !selectedChat) return
        const content = inputText
        setInputText('')
        setSending(true)

        if (selectedChat.type === 'group') {
            await sendGroupMessage(selectedChatId, content)
        } else {
            await sendDirectMessage(selectedChatId, content)
        }
        setSending(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const sidebarClass = cn(
        "bg-white border-r border-slate-100 flex flex-col md:w-80 w-full h-full md:flex absolute md:relative z-10 transition-transform duration-300",
        mobileView === 'list' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )

    const chatAreaClass = cn(
        "bg-slate-50 flex flex-col flex-1 h-full w-full absolute md:relative transition-transform duration-300",
        mobileView === 'chat' ? "translate-x-0" : "translate-x-full md:translate-x-0"
    )

    return (
        <div className="flex h-full rounded-2xl md:border border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className={sidebarClass}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-black text-xl text-slate-800 tracking-tight">Nachrichten</h2>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{allChats.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {/* Groups Section */}
                    {groups.length > 0 && <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Gruppen</div>}
                    {groups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => { setSelectedChatId(group.id); setMobileView('chat') }}
                            className={cn(
                                "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all",
                                selectedChatId === group.id ? "bg-primary text-white shadow-md shadow-blue-200" : "hover:bg-slate-50 text-slate-700"
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm border", selectedChatId === group.id ? "bg-white/20 border-white/20" : "bg-white border-slate-100")}>
                                {group.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{group.name}</p>
                                <p className={cn("text-xs truncate", selectedChatId === group.id ? "text-blue-100" : "text-slate-400")}>Gruppenchat</p>
                            </div>
                        </button>
                    ))}

                    {/* DMs Section */}
                    {directChats.length > 0 && <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Direktnachrichten</div>}
                    {directChats.map(dm => (
                        <button
                            key={dm.chat_id}
                            onClick={() => { setSelectedChatId(dm.chat_id); setMobileView('chat') }}
                            className={cn(
                                "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all",
                                selectedChatId === dm.chat_id ? "bg-primary text-white shadow-md shadow-blue-200" : "hover:bg-slate-50 text-slate-700"
                            )}
                        >
                            <Avatar className="w-10 h-10 border border-slate-100 shadow-sm">
                                <AvatarImage src={dm.profiles.avatar_url} />
                                <AvatarFallback className="text-xs">{dm.profiles.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{dm.profiles.full_name}</p>
                                <p className={cn("text-xs truncate", selectedChatId === dm.chat_id ? "text-blue-100" : "text-slate-400")}>Privatchat</p>
                            </div>
                        </button>
                    ))}

                    {allChats.length === 0 && (
                        <div className="text-center p-8 text-slate-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">Keine Chats.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={chatAreaClass}>
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b border-slate-100 p-4 shrink-0 flex items-center gap-3 shadow-sm z-20">
                            <button onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            {selectedChat.type === 'group' ? (
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 text-xl">
                                    {selectedChat.icon}
                                </div>
                            ) : (
                                <Avatar className="w-10 h-10 border border-slate-100 shadow-sm">
                                    <AvatarImage src={selectedChat.avatarUrl!} />
                                    <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex-1">
                                <h3 className="font-black text-slate-800 leading-none">{selectedChat.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">{selectedChat.type === 'group' ? 'Gruppenchat' : 'Privater Chat'}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                            {loading ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                    <MessageSquare className="w-16 h-16 opacity-20" />
                                    <p className="font-bold">Noch keine Nachrichten.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.user_id === user.id
                                    const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id
                                    return (
                                        <div key={msg.id} className={cn("flex gap-3 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                            <div className={cn("w-8 h-8 shrink-0", !showAvatar && "invisible")}>
                                                <Avatar className="w-8 h-8 border border-white shadow-sm">
                                                    <AvatarImage src={msg.profiles?.avatar_url} />
                                                    <AvatarFallback className="bg-slate-200 text-[10px]">{msg.profiles?.full_name[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className={cn("flex flex-col gap-1 min-w-0")}>
                                                {showAvatar && !isMe && selectedChat.type === 'group' && (
                                                    <span className="text-[10px] font-bold text-slate-400 ml-1">{msg.profiles?.full_name}</span>
                                                )}
                                                <div className={cn("p-3 rounded-2xl text-sm font-medium shadow-sm break-words relative group/msg", isMe ? "bg-primary text-white rounded-tr-sm" : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm")}>
                                                    {msg.content}
                                                    <span className={cn("text-[9px] block text-right mt-1 opacity-60", isMe ? "text-blue-100" : "text-slate-300")}>{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                                <Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Nachricht schreiben..." className="border-none bg-transparent shadow-none focus-visible:ring-0 h-11 px-4 font-medium" />
                                <Button onClick={handleSend} disabled={!inputText.trim() || sending} size="icon" className={cn("h-11 w-11 rounded-2xl shrink-0 transition-all", inputText.trim() ? "bg-primary text-white shadow-lg hover:scale-105" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center hidden md:flex">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">Wähle einen Chat</h3>
                        <p>Beginne eine Unterhaltung.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
