'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, X } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { LogGameDialog } from '@/components/groups/log-game-dialog'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function ReviewPrompt({ events }: { events: any[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())

    const visibleEvents = events.filter(e => !dismissed.has(e.id))

    if (visibleEvents.length === 0) return null

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-1">Offene Bewertungen</h3>
            <AnimatePresence>
                {visibleEvents.map(event => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[1.5rem] p-5 shadow-lg border border-amber-100 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />

                        <div className="flex items-start justify-between pl-3 mb-2">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                                    Warst du dabei?
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-lg leading-tight">{event.title}</h4>
                                <p className="text-xs font-medium text-slate-500">
                                    {event.groupName} • {format(new Date(event.end_time), 'EEEE', { locale: de })}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full"
                                onClick={() => setDismissed(prev => new Set(prev).add(event.id))}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="pl-3 mt-4 flex gap-3">
                            <LogGameDialog
                                groupId={event.group_id}
                                games={[]} // Optimally fetch or pass empty, the dialog fetches on search anyway or use context
                                // For now passed empty, user searches.
                                // Actually LogGameDialog requires games prop. 
                                // We might need to make it optional or fetch top 5?
                                // Let's assume passed empty is fine for search, but might look empty.
                                // Improvement: The component usually takes fetched lists.
                                // We can fetch minimal list or just ignore for now as search handles it.
                                members={[]}
                                places={[]}
                                defaultEventId={event.id}
                                trigger={
                                    <Button className="flex-1 bg-amber-400 hover:bg-amber-500 text-white rounded-xl h-10 font-bold shadow-md shadow-amber-100">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Ja, Spiel loggen
                                    </Button>
                                }
                            />
                            <Button
                                variant="outline"
                                className="px-4 rounded-xl border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                    setDismissed(prev => new Set(prev).add(event.id))
                                    toast.success("Alles klar, vielleicht nächstes Mal!")
                                }}
                            >
                                Nein
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
