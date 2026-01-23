'use client'

import { useState } from 'react'
import { Dice5, ChevronDown, ChevronUp, User, Search } from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input'

interface Game {
    id: string
    name: string
    image_url?: string
    profiles: {
        full_name: string
        avatar_url?: string
    }
}

export function GroupGamesCard({ games }: { games: any[] }) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredGames = games.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (games.length === 0) return null

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Dice5 className="w-6 h-6 text-primary" />
                    Spiele der Gruppe
                </h2>
                <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                    {games.length} Titel
                </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="games-list" className="sky-card border-none overflow-hidden">
                    <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Dice5 className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800">Gruppen-Bibliothek</p>
                                <p className="text-xs text-slate-400">Alle Spiele der Mitglieder auf einen Blick</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 md:px-6 pb-6 pt-2 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Spiel suchen..."
                                className="pl-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all shadow-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {filteredGames.length > 0 ? (
                                filteredGames.map((game, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-primary/20 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-50">
                                            {game.image_url ? (
                                                <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Dice5 className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{game.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {game.profiles?.avatar_url ? (
                                                        <img src={game.profiles.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-2 h-2 text-slate-400" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                                    von {game.profiles?.full_name?.split(' ')[0]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-slate-400 italic">
                                    Keine Spiele gefunden.
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    )
}
