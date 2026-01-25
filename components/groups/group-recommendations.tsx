'use client'

import { Sparkles, Dice5, User } from 'lucide-react'
import { useState } from 'react'

interface Recommendation {
    name: string
    imageUrl?: string
    owners: { name: string, avatar?: string }[]
}

export function GroupRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
    if (!recommendations || recommendations.length === 0) return null

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Vorschläge
            </h2>
            <div className="sky-card p-6 bg-gradient-to-br from-purple-50/50 to-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700">Ungespielte Schätze (Pile of Shame)</h3>
                    <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        Neu
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec) => (
                        <div key={rec.name} className="flex items-start gap-4 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {rec.imageUrl ? (
                                    <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Dice5 className="w-6 h-6 text-slate-300" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-slate-800 text-sm truncate" title={rec.name}>{rec.name}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Besitzer:</span>
                                    <div className="flex -space-x-1.5">
                                        {rec.owners.slice(0, 3).map((owner, i) => (
                                            <div key={i} className="w-4 h-4 rounded-full border border-white bg-slate-200 flex items-center justify-center overflow-hidden" title={owner.name}>
                                                {owner.avatar ? (
                                                    <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[8px] font-black text-slate-500">{owner.name[0]}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
