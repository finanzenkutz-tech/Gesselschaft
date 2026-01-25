import { Trophy, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameOfTheMonthCardProps {
    game: {
        name: string
        image: string
        count: number
    } | null
}

export function GameOfTheMonthCard({ game }: GameOfTheMonthCardProps) {
    if (!game) return null

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-orange-200/50 group transition-all hover:scale-[1.02] hover:shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

            {/* Confetti/Sparkles effect (static w/ slight pulse) */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />

            <div className="relative p-6 h-full flex flex-col justify-between z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-xl border border-white/30">
                                <Trophy className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-white/90">
                                Spiel des Monats
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white leading-tight drop-shadow-sm line-clamp-2">
                            {game.name}
                        </h3>
                    </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-5xl font-black text-white drop-shadow-md">
                            {game.count}x
                        </span>
                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
                            Gespielt
                        </span>
                    </div>

                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-inner overflow-hidden shrink-0 rotate-3 group-hover:rotate-6 transition-transform">
                        {game.image ? (
                            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Trophy className="w-8 h-8 text-white/40" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
