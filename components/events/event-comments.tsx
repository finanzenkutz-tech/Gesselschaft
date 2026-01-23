'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addEventComment, deleteEventComment } from '@/app/events/comment-actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

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
        <div className="space-y-6">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Kommentare ({comments.length})
            </h3>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                    placeholder="Schreibe einen Kommentar..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="rounded-xl border-slate-100 bg-slate-50 focus:ring-primary/20"
                />
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="bg-primary hover:bg-blue-600 text-white rounded-xl gap-2 px-6 font-bold"
                    >
                        <Send className="w-4 h-4" />
                        Senden
                    </Button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">Noch keine Kommentare. Sei der Erste!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden border border-blue-100">
                                {comment.profiles?.avatar_url ? (
                                    <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-blue-400" />
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-800 text-sm">{comment.profiles?.full_name || 'Spieler'}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-slate-400 font-medium uppercase">
                                            {new Date(comment.created_at).toLocaleDateString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {comment.user_id === currentUserId && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                                                title="Kommentar löschen"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100/50">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
