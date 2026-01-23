'use client'

import { useState, useOptimistic, useTransition, useEffect } from 'react'
import { Lightbulb, ThumbsUp, CheckCircle, TrendingUp, Sparkles, Filter, ArrowUpDown, Trash2 } from 'lucide-react'
import { voteForFeature, markFeatureAsCompleted, deleteFeatureRequest } from '@/app/features/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Feature {
    id: string
    title: string
    description: string | null
    votes: number
    status: 'open' | 'completed' | 'planned'
    created_at: string
    implemented_at: string | null
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

interface FeaturesListProps {
    initialFeatures: Feature[]
    currentUserId: string | null
    isSuperAdmin: boolean
}

export function FeaturesList({ initialFeatures, currentUserId, isSuperAdmin }: FeaturesListProps) {
    const [filter, setFilter] = useState<'open' | 'completed'>('open')
    const [sort, setSort] = useState<'votes' | 'newest'>('votes')
    const [isPending, startTransition] = useTransition()

    // Optimistic State
    const [optimisticFeatures, addOptimisticFeature] = useOptimistic(
        initialFeatures,
        (state, updatedFeature: Feature) => {
            // Check if it's a delete operation (we'll tag it with a special status or just filter it out)
            // Ideally we'd have a discriminated union for actions but for now:
            // If we pass a feature with status 'deleted', we remove it.
            if (updatedFeature.status === 'deleted' as any) {
                return state.filter(f => f.id !== updatedFeature.id)
            }

            const index = state.findIndex(f => f.id === updatedFeature.id)
            if (index === -1) return state
            const newState = [...state]
            newState[index] = updatedFeature
            return newState
        }
    )

    // Derived state based on filter and sort
    const filteredFeatures = optimisticFeatures
        .filter(f => filter === 'open' ? f.status !== 'completed' : f.status === 'completed')
        .sort((a, b) => {
            if (sort === 'votes') return b.votes - a.votes
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

    const handleVote = async (feature: Feature) => {
        if (!currentUserId) {
            toast.error('Bitte melde dich an, um abzustimmen.')
            return
        }

        // Optimistic update
        addOptimisticFeature({
            ...feature,
            votes: feature.votes + 1
        })

        toast.success('Stimme abgegeben!')

        try {
            const result = await voteForFeature(feature.id)
            if (!result.success) {
                toast.error(result.error || 'Fehler beim Abstimmen')
            }
        } catch (error) {
            toast.error('Ein Fehler ist aufgetreten.')
        }
    }

    const handleComplete = async (feature: Feature) => {
        if (!confirm('Sicher, dass dieses Feature fertig ist?')) return

        // Optimistic update
        addOptimisticFeature({
            ...feature,
            status: 'completed',
            implemented_at: new Date().toISOString()
        })

        const result = await markFeatureAsCompleted(feature.id)
        if (result.success) {
            toast.success('Feature als erledigt markiert')
        } else {
            toast.error(result.error)
        }
    }

    const handleDelete = async (featureId: string) => {
        if (!confirm('Feature wirklich löschen?')) return

        // Optimistic delete
        // We create a dummy feature object with 'deleted' status to signal removal
        // logic handled in useOptimistic reducer
        const featureToDelete = initialFeatures.find(f => f.id === featureId)
        if (featureToDelete) {
            addOptimisticFeature({
                ...featureToDelete,
                status: 'deleted' as any
            })
        }

        const result = await deleteFeatureRequest(featureId)
        if (result.success) {
            toast.success('Feature gelöscht')
        } else {
            toast.error(result.error)
        }
    }

    // To fix hydration errors with dates, we can just use a simple formatter
    const formatDate = (dateString: string | null) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-sm">
                <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 p-1 h-auto rounded-xl">
                        <TabsTrigger value="open" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 font-bold">
                            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                            Offen
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 font-bold">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Erledigt
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                            <SelectTrigger className="w-full bg-slate-100/80 border-none rounded-xl font-bold h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-xl">
                                <SelectItem value="votes" className="font-bold cursor-pointer">
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" /> Beliebteste
                                    </span>
                                </SelectItem>
                                <SelectItem value="newest" className="font-bold cursor-pointer">
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" /> Neueste
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFeatures.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        Keine Features gefunden.
                    </div>
                ) : (
                    filteredFeatures.map((feature, idx) => (
                        <div
                            key={feature.id}
                            className={cn(
                                "sky-card p-5 flex flex-col gap-4 group hover:border-primary/30 transition-all relative overflow-hidden bg-white",
                                feature.status === 'completed' && "opacity-80 grayscale-[0.2]"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {(sort === 'votes' && idx < 3 && filter === 'open') && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
                                                idx === 0 ? "bg-yellow-100 text-yellow-600" :
                                                    idx === 1 ? "bg-slate-100 text-slate-600" :
                                                        "bg-orange-100 text-orange-600"
                                            )}>
                                                Top {idx + 1}
                                            </span>
                                        )}
                                        {feature.status === 'completed' && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase shrink-0 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Fertig
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 leading-snug">{feature.title}</h3>
                                </div>

                                {filter === 'open' && (
                                    <Button
                                        onClick={() => startTransition(() => handleVote(feature))}
                                        variant="ghost"
                                        className="flex flex-col gap-0.5 h-auto p-2 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
                                    >
                                        <ThumbsUp className={cn("w-5 h-5", feature.votes > 0 ? "fill-primary/20 text-primary" : "text-slate-400")} />
                                        <span className={cn("text-xs font-bold", feature.votes > 0 ? "text-primary" : "text-slate-500")}>{feature.votes}</span>
                                    </Button>
                                )}
                            </div>

                            {feature.description && (
                                <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                                    {feature.description}
                                </p>
                            )}

                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                                <span className="font-medium truncate max-w-[120px]">
                                    {feature.profiles?.full_name || 'Anonym'}
                                </span>
                                <span>
                                    {feature.status === 'completed' && feature.implemented_at
                                        ? formatDate(feature.implemented_at)
                                        : formatDate(feature.created_at)
                                    }
                                </span>
                            </div>

                            {isSuperAdmin && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 transition-opacity bg-white/50 backdrop-blur-sm rounded-full p-1 border border-white/50">
                                    {feature.status !== 'completed' && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                            onClick={() => handleComplete(feature)}
                                            title="Als fertig markieren"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => handleDelete(feature.id)}
                                        title="Löschen"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
