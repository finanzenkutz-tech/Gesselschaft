'use client'

import { useState } from 'react'
import { Calendar, Check, HelpCircle, X, Plus, Vote, ChevronDown, ChevronUp, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { votePoll, closePoll } from '@/app/groups/poll-actions'
import { cn } from '@/lib/utils'

interface PollOption {
    id: string
    date_option: string
    poll_votes: {
        user_id: string
        vote_type: 'yes' | 'maybe' | 'no'
        profiles: { full_name: string }
    }[]
}

interface Poll {
    id: string
    title: string
    description: string
    status: 'open' | 'closed' | 'decided'
    decided_date: string | null
    created_by: string
    profiles: { full_name: string; avatar_url: string }
    poll_options: PollOption[]
}

interface PollWidgetProps {
    polls: Poll[]
    groupId: string
    userId?: string
}

export function PollWidget({ polls, groupId, userId }: PollWidgetProps) {
    const [expandedPoll, setExpandedPoll] = useState<string | null>(polls[0]?.id || null)

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getVoteCounts = (option: PollOption) => {
        const yes = option.poll_votes.filter(v => v.vote_type === 'yes').length
        const maybe = option.poll_votes.filter(v => v.vote_type === 'maybe').length
        const no = option.poll_votes.filter(v => v.vote_type === 'no').length
        return { yes, maybe, no, total: yes + maybe + no }
    }

    const getUserVote = (option: PollOption) => {
        return option.poll_votes.find(v => v.user_id === userId)?.vote_type
    }

    const handleVote = async (optionId: string, voteType: 'yes' | 'maybe' | 'no') => {
        await votePoll(optionId, voteType)
    }

    const handleClosePoll = async (pollId: string, optionId: string) => {
        await closePoll(pollId, optionId)
    }

    if (polls.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                Termin-Umfragen
            </h3>

            {polls.map(poll => (
                <div key={poll.id} className="sky-card overflow-hidden">
                    <button
                        onClick={() => setExpandedPoll(expandedPoll === poll.id ? null : poll.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                poll.status === 'decided' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {poll.status === 'decided' ? <Crown className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800">{poll.title}</p>
                                <p className="text-xs text-slate-500">
                                    {poll.status === 'decided'
                                        ? `Entschieden: ${formatDate(poll.decided_date!)}`
                                        : `${poll.poll_options.length} Optionen`
                                    }
                                </p>
                            </div>
                        </div>
                        {expandedPoll === poll.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    {expandedPoll === poll.id && (
                        <div className="p-4 pt-0 space-y-3">
                            {poll.description && (
                                <p className="text-sm text-slate-600 px-2">{poll.description}</p>
                            )}

                            <div className="space-y-2">
                                {poll.poll_options
                                    .sort((a, b) => getVoteCounts(b).yes - getVoteCounts(a).yes)
                                    .map(option => {
                                        const counts = getVoteCounts(option)
                                        const userVote = getUserVote(option)
                                        const isTopChoice = counts.yes === Math.max(...poll.poll_options.map(o => getVoteCounts(o).yes)) && counts.yes > 0

                                        return (
                                            <div
                                                key={option.id}
                                                className={cn(
                                                    "p-3 rounded-xl border transition-all",
                                                    isTopChoice ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-100"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {isTopChoice && <Crown className="w-4 h-4 text-yellow-500" />}
                                                        <span className="font-bold text-sm text-slate-700">
                                                            {formatDate(option.date_option)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className="text-green-600 font-bold">{counts.yes}✓</span>
                                                        <span className="text-yellow-600 font-bold">{counts.maybe}?</span>
                                                        <span className="text-red-500 font-bold">{counts.no}✗</span>
                                                    </div>
                                                </div>

                                                {poll.status === 'open' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant={userVote === 'yes' ? 'default' : 'outline'}
                                                            onClick={() => handleVote(option.id, 'yes')}
                                                            className={cn(
                                                                "flex-1 h-8 rounded-lg text-xs",
                                                                userVote === 'yes' && "bg-green-500 hover:bg-green-600"
                                                            )}
                                                        >
                                                            <Check className="w-3 h-3 mr-1" /> Ja
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={userVote === 'maybe' ? 'default' : 'outline'}
                                                            onClick={() => handleVote(option.id, 'maybe')}
                                                            className={cn(
                                                                "flex-1 h-8 rounded-lg text-xs",
                                                                userVote === 'maybe' && "bg-yellow-500 hover:bg-yellow-600"
                                                            )}
                                                        >
                                                            <HelpCircle className="w-3 h-3 mr-1" /> Vielleicht
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={userVote === 'no' ? 'default' : 'outline'}
                                                            onClick={() => handleVote(option.id, 'no')}
                                                            className={cn(
                                                                "flex-1 h-8 rounded-lg text-xs",
                                                                userVote === 'no' && "bg-red-500 hover:bg-red-600"
                                                            )}
                                                        >
                                                            <X className="w-3 h-3 mr-1" /> Nein
                                                        </Button>
                                                    </div>
                                                )}

                                                {poll.status === 'open' && poll.created_by === userId && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleClosePoll(poll.id, option.id)}
                                                        className="w-full mt-2 text-xs text-primary hover:bg-primary/10"
                                                    >
                                                        Diesen Termin festlegen
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
