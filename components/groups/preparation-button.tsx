'use client'

import { useState } from 'react'
import { Coffee, Pizza, MapPin, CheckCircle2, Clock, Calendar, ArrowRight, UserCheck } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PreparationButtonProps {
    groupId: string
    nextEvent?: any
    isMember: boolean
}

export function PreparationButton({ groupId, nextEvent, isMember }: PreparationButtonProps) {
    const [open, setOpen] = useState(false)

    if (!isMember || !nextEvent) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-200 border-none font-black uppercase tracking-wider gap-3 animate-pulse-subtle"
                >
                    <Coffee className="w-5 h-5" />
                    Treffen vorbereiten
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white relative">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Pizza className="w-8 h-8" /> Session-Vorbereitung
                    </DialogTitle>
                    <DialogDescription className="text-amber-100 mt-2 font-medium opacity-90">
                        Alles bereit für den nächsten Spieleabend?
                    </DialogDescription>
                    <Coffee className="w-32 h-32 opacity-10 absolute -top-4 -right-4 rotate-12 pointer-events-none" />
                </div>

                <div className="p-8 space-y-6">
                    {!nextEvent ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-800">Noch kein Termin geplant</h3>
                                <p className="text-sm text-slate-500">Erstelle erst ein Event, um die Details zu planen.</p>
                            </div>
                            <Button asChild className="rounded-xl w-full h-12">
                                <Link href={`/groups/${groupId}`}>Event planen</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Event Summary */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-slate-800">{nextEvent.title}</h4>
                                    <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Nächstes Treffen</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                        {new Date(nextEvent.start_time).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold truncate">
                                        <MapPin className="w-3.5 h-3.5 text-secondary" />
                                        {nextEvent.location || 'Ort folgt'}
                                    </div>
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Checkliste</h4>

                                <div className="space-y-3">
                                    <PrepItem
                                        icon={<UserCheck className="w-4 h-4" />}
                                        title="Zusagen prüfen"
                                        description="Wissen alle Bescheid und kommen pünktlich?"
                                        status="done"
                                        href={`/events/${nextEvent.id}`}
                                    />
                                    <PrepItem
                                        icon={<Pizza className="w-4 h-4" />}
                                        title="Snacks & Getränke"
                                        description="Wer bringt was mit? Liste vervollständigen."
                                        status="pending"
                                        href={`/events/${nextEvent.id}?tab=logistics`}
                                    />
                                    <PrepItem
                                        icon={<Coffee className="w-4 h-4" />}
                                        title="Spielauswahl"
                                        description="Welche Spiele sollen auf den Tisch?"
                                        status="pending"
                                        href={`/events/${nextEvent.id}?tab=games`}
                                    />
                                </div>
                            </div>

                            <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 group">
                                <Link href={`/events/${nextEvent.id}`}>
                                    Zum Event Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PrepItem({ icon, title, description, status, href }: { icon: any, title: string, description: string, status: 'done' | 'pending', href: string }) {
    return (
        <Link href={href} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                status === 'done' ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"
            )}>
                {status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm">{title}</p>
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        status === 'done' ? "text-emerald-500" : "text-amber-500"
                    )}>
                        {status === 'done' ? 'Erledigt' : 'Offen'}
                    </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{description}</p>
            </div>
        </Link>
    )
}
