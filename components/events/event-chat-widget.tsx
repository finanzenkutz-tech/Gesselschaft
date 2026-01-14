'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addEventComment, deleteEventComment } from '@/app/events/comment-actions'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

type Comment = {
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
    comments,
    currentUserId
}: {
    eventId: string,
    comments: Comment[],
    currentUserId: string
}) {
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on mount or new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [comments.length])

    async function handleSend() {
        if (!newMessage.trim()) return
        setIsSending(true)

        // Optimistic update could be added here
        const result = await addEventComment(eventId, newMessage)

        setIsSending(false)
        if (result.success) {
            setNewMessage('')
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    async function handleDelete(commentId: string) {
        if (!confirm('Kommentar löschen?')) return
        const result = await deleteEventComment(commentId)
        if (result.success) {
            router.refresh()
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Event Chat
                </h3>
                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {comments.length}
                </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center text-slate-400 py-10">
                        <p>Noch keine Nachrichten.</p>
                        <p className="text-sm">Schreib als Erster!</p>
                    </div>
                ) : (
                    comments.map(comment => {
                        const isMe = comment.user_id === currentUserId
                        return (
                            <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    {comment.user.avatar_url ? (
                                        <img src={comment.user.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                                            {comment.user.full_name?.[0] || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mx-1">
                                        <span>{comment.user.full_name}</span>
                                        <span>•</span>
                                        <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed relative group ${isMe
                                            ? 'bg-blue-500 text-white rounded-tr-none'
                                            : 'bg-slate-100 text-slate-700 rounded-tl-none'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{comment.content}</p>

                                        {isMe && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="absolute -left-8 top-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Nachricht schreiben..."
                        className="min-h-[50px] max-h-[150px] resize-none border-slate-200 focus:border-blue-500 rounded-xl"
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
                        className="h-auto rounded-xl bg-blue-500 hover:bg-blue-600 shadow-blue-200 shadow-lg px-4"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
