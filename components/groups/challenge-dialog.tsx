'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Swords, Calendar, Send, Loader2 } from 'lucide-react'
import { createChallenge } from '@/app/groups/challenge-actions'
import { toast } from 'sonner'

interface ChallengeDialogProps {
    challengerGroupId: string
    challengerGroupName: string
    challengedGroupId: string
    challengedGroupName: string
    trigger?: React.ReactNode
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ChallengeDialog({
    challengerGroupId,
    challengerGroupName,
    challengedGroupId,
    challengedGroupName,
    trigger,
    onSuccess,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: ChallengeDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [proposedDate, setProposedDate] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const result = await createChallenge({
            challengerGroupId,
            challengedGroupId,
            message: message || undefined,
            proposedDate: proposedDate || undefined
        })

        if (result.success) {
            toast.success('Herausforderung gesendet! ⚔️')
            onOpenChange?.(false)
            setMessage('')
            setProposedDate('')
            onSuccess?.()
        } else {
            toast.error(result.error || 'Fehler beim Senden')
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Swords className="w-6 h-6 text-orange-500" />
                        Gruppe herausfordern
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Visual Challenge Header */}
                    <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl mb-6">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-1">
                                {challengerGroupName[0]}
                            </div>
                            <p className="text-xs font-bold text-slate-600 truncate max-w-20">
                                {challengerGroupName}
                            </p>
                        </div>
                        <div className="text-2xl">⚔️</div>
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-1">
                                {challengedGroupName[0]}
                            </div>
                            <p className="text-xs font-bold text-slate-600 truncate max-w-20">
                                {challengedGroupName}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Message */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Nachricht (optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hey! Wir fordern euch zu einem epischen Spieleabend heraus..."
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Proposed Date */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Vorgeschlagenes Datum (optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={proposedDate}
                                onChange={(e) => setProposedDate(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg font-bold"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Herausforderung senden
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
