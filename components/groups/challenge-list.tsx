'use client'

import { useState } from 'react'
import { Swords, Check, X, Clock, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { respondToChallenge, cancelChallenge } from '@/app/groups/challenge-actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface Challenge {
    id: string
    message?: string
    proposed_date?: string
    status: 'pending' | 'accepted' | 'declined' | 'cancelled'
    response_message?: string
    created_at: string
    responded_at?: string
    challenger_group?: { id: string; name: string }
    challenged_group?: { id: string; name: string }
    created_by_profile?: { full_name: string }
    responded_by_profile?: { full_name: string }
}

interface ChallengeListProps {
    incoming: Challenge[]
    outgoing: Challenge[]
    isAdmin: boolean
    groupName: string
}

export function ChallengeList({ incoming, outgoing, isAdmin, groupName }: ChallengeListProps) {
    const [showAll, setShowAll] = useState(false)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [responseMessage, setResponseMessage] = useState<Record<string, string>>({})

    const pendingIncoming = incoming.filter(c => c.status === 'pending')
    const pendingOutgoing = outgoing.filter(c => c.status === 'pending')
    const historyChallenges = [...incoming, ...outgoing].filter(c => c.status !== 'pending')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const handleRespond = async (challengeId: string, accept: boolean) => {
        setLoadingId(challengeId)
        const result = await respondToChallenge(
            challengeId,
            accept,
            responseMessage[challengeId]
        )

        if (result.success) {
            toast.success(accept ? 'Herausforderung angenommen! 🎉' : 'Herausforderung abgelehnt')
        } else {
            toast.error(result.error)
        }
        setLoadingId(null)
    }

    const handleCancel = async (challengeId: string) => {
        setLoadingId(challengeId)
        const result = await cancelChallenge(challengeId)
        if (result.success) {
            toast.success('Herausforderung zurückgezogen')
        } else {
            toast.error(result.error)
        }
        setLoadingId(null)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Ausstehend</span>
            case 'accepted':
                return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Angenommen</span>
            case 'declined':
                return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" /> Abgelehnt</span>
            default:
                return null
        }
    }

    if (incoming.length === 0 && outgoing.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <Swords className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Noch keine Herausforderungen</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Pending Incoming Challenges - Most Important */}
            {pendingIncoming.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-orange-500 flex items-center gap-2">
                        <Swords className="w-4 h-4" />
                        Eingehende Herausforderungen ({pendingIncoming.length})
                    </h4>
                    {pendingIncoming.map(challenge => (
                        <div key={challenge.id} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <Link href={`/groups/${challenge.challenger_group?.id}`} className="font-bold text-slate-800 hover:text-orange-600 transition-colors">
                                        {challenge.challenger_group?.name}
                                    </Link>
                                    <p className="text-xs text-slate-400">
                                        fordert euch heraus • {new Date(challenge.created_at).toLocaleDateString('de-DE')}
                                    </p>
                                </div>
                                {getStatusBadge(challenge.status)}
                            </div>

                            {challenge.message && (
                                <p className="text-sm text-slate-600 italic mb-3 p-2 bg-white/50 rounded-lg">
                                    "{challenge.message}"
                                </p>
                            )}

                            {challenge.proposed_date && (
                                <p className="text-xs text-slate-500 mb-3">
                                    📅 Vorgeschlagen: {new Date(challenge.proposed_date).toLocaleDateString('de-DE', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            )}

                            {isAdmin && (
                                <div className="space-y-3">
                                    <textarea
                                        value={responseMessage[challenge.id] || ''}
                                        onChange={(e) => setResponseMessage(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                                        placeholder="Antwort-Nachricht (optional)..."
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleRespond(challenge.id, true)}
                                            disabled={loadingId === challenge.id}
                                            className="flex-1 rounded-lg bg-green-500 hover:bg-green-600"
                                        >
                                            {loadingId === challenge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                            Annehmen
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRespond(challenge.id, false)}
                                            disabled={loadingId === challenge.id}
                                            className="flex-1 rounded-lg border-red-200 text-red-500 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Ablehnen
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pending Outgoing Challenges */}
            {pendingOutgoing.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-blue-500 flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Gesendete Herausforderungen ({pendingOutgoing.length})
                    </h4>
                    {pendingOutgoing.map(challenge => (
                        <div key={challenge.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">An:</p>
                                    <Link href={`/groups/${challenge.challenged_group?.id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors">
                                        {challenge.challenged_group?.name}
                                    </Link>
                                </div>
                                {getStatusBadge(challenge.status)}
                            </div>

                            {challenge.message && (
                                <p className="text-sm text-slate-500 italic mb-3">"{challenge.message}"</p>
                            )}

                            {isAdmin && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCancel(challenge.id)}
                                    disabled={loadingId === challenge.id}
                                    className="text-slate-400 hover:text-red-500 text-xs"
                                >
                                    {loadingId === challenge.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                    Zurückziehen
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* History */}
            {historyChallenges.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors w-full"
                    >
                        {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Historie ({historyChallenges.length})
                    </button>

                    {showAll && (
                        <div className="mt-3 space-y-2">
                            {historyChallenges.slice(0, 5).map(challenge => {
                                const isIncoming = !!challenge.challenger_group
                                const otherGroup = isIncoming ? challenge.challenger_group : challenge.challenged_group

                                return (
                                    <div key={challenge.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between opacity-70">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">
                                                {isIncoming ? 'Von' : 'An'}: {otherGroup?.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(challenge.created_at).toLocaleDateString('de-DE')}
                                            </p>
                                        </div>
                                        {getStatusBadge(challenge.status)}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
