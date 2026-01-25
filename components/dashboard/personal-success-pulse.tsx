'use client'

import { Activity } from 'lucide-react'

export function PersonalSuccessPulse({ data }: { data: { month: string, value: number }[] }) {
    // If no data or empty, show placeholders
    const effectiveData = data.length > 0 ? data : [
        { month: 'Jan', value: 0 }, { month: 'Feb', value: 0 },
        { month: 'Mar', value: 0 }, { month: 'Apr', value: 0 },
        { month: 'Mai', value: 0 }, { month: 'Jun', value: 0 }
    ]

    // Find absolute max for scaling, but at least 4 to make graphs look nice even with low data
    const max = Math.max(...effectiveData.map(d => d.value), 4)

    return (
        <div className="sky-card p-6 h-full min-h-[250px] flex flex-col justify-between border border-pink-100 relative overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-white">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Activity className="w-24 h-24 text-pink-600" />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10 block">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-extrabold text-lg text-slate-800">Success Pulse</h3>
                    <p className="text-slate-500 text-xs font-medium">Deine Spiel-Aktivität</p>
                </div>
            </div>

            <div className="flex items-end justify-between gap-3 h-32 relative z-10 w-full mt-auto">
                {effectiveData.map((d, i) => {
                    const heightPercent = Math.max((d.value / max) * 100, 4) // Min height 4% for visibility
                    return (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                            <div className="w-full bg-pink-50/50 rounded-lg relative h-full flex items-end overflow-hidden group-hover:bg-pink-100/50 transition-colors">
                                <div
                                    style={{ height: `${heightPercent}%` }}
                                    className="w-full bg-gradient-to-t from-pink-500 to-pink-400 rounded-lg transition-all duration-1000 ease-in-out group-hover:from-pink-600 group-hover:to-pink-500 relative shadow-sm"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                        {d.value} Spiele
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.month.slice(0, 1)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
