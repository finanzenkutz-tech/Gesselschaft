'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addEventComment, deleteEventComment } from '@/app/(app)/events/comment-actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        avatar_url: string
    }
}

interface EventCommentsProps {
    eventId: string
    initialComments: any[]
    currentUserId: string
}

export function EventComments({ eventId, initialComments, currentUserId }: EventCommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`event-comments-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'event_comments',
                    filter: `event_id=eq.${eventId}`
                },
                async (payload) => {
                    // Fetch full profile for the new comment
                    const { data: newCommentData } = await supabase
                        .from('event_comments')
                        .select('*, profiles(full_name, avatar_url)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newCommentData) {
                        setComments(prev => {
                            if (prev.find(c => c.id === newCommentData.id)) return prev
                            return [...prev, newCommentData]
                        })
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'event_comments',
                    filter: `event_id=eq.${eventId}`
                },
                (payload) => {
                    setComments(prev => prev.filter(c => c.id !== payload.old.id))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        const result = await addEventComment(eventId, newComment.trim())

        if (result.success) {
            setNewComment('')
            toast.success('Kommentar hinzugefügt')
        } else {
            toast.error('Fehler: ' + result.error)
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Kommentar wirklich löschen?')) return

        const result = await deleteEventComment(id, eventId)
        if (result.success) {
            setComments(prev => prev.filter(c => c.id !== id))
            toast.success('Kommentar gelöscht')
        }
    }

    return (
        <div className="space-y-8">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Besprechung ({comments.length})
            </h3>

            {/* List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                        <MessageSquare className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                        <p className="text-slate-400 text-sm">Noch keine Kommentare. Sei der Erste!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {comments.map((comment) => {
                            const isMine = comment.user_id === currentUserId
                            return (
                                <div key={comment.id} className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    isMine ? "ml-auto flex-row-reverse" : ""
                                )}>
                                    <Avatar className="w-8 h-8 shrink-0 mt-1 border-2 border-white shadow-sm">
                                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                        <AvatarFallback className="text-[10px] bg-blue-50 text-blue-500 font-bold">
                                            {comment.profiles?.full_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <div className={cn(
                                            "flex items-center gap-2",
                                            isMine ? "flex-row-reverse" : ""
                                        )}>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {isMine ? 'Du' : comment.profiles?.full_name}
                                            </span>
                                            <span className="text-[10px] text-slate-300 font-medium">
                                                {new Date(comment.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "p-4 text-sm shadow-sm relative group",
                                            isMine
                                                ? "bg-primary text-white rounded-2xl rounded-tr-none"
                                                : "bg-white text-slate-600 rounded-2xl rounded-tl-none border border-slate-100"
                                        )}>
                                            {comment.content}
                                            {isMine && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1"
                                                    title="Löschen"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative pt-4 border-t border-slate-100">
                <Textarea
                    placeholder="Schreibe eine Nachricht..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-primary/10 transition-all resize-none pr-16"
                />
                <Button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="absolute bottom-4 right-4 h-10 w-10 p-0 rounded-xl bg-primary hover:bg-blue-600 text-white shadow-lg hover:shadow-primary/20 transition-all"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    )
}

