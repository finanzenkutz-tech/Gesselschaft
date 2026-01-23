'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, Zap, Users, LayoutGrid, Dice5, Check } from 'lucide-react'
import { confirmGodMode } from '@/app/(app)/admin/actions'
import { toast } from 'sonner'

interface GodModePopupProps {
    profile: any
}

export function GodModePopup({ profile }: GodModePopupProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (profile?.system_role === 'super_admin' && !profile?.has_seen_god_mode) {
            setOpen(true)
        }
    }, [profile])

    const handleConfirm = async () => {
        setLoading(true)
        const result = await confirmGodMode()
        if (result.success) {
            setOpen(false)
            toast.success('God Modus bestätigt!')
        } else {
            toast.error('Fehler: ' + result.error)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center relative overflow-hidden">
                    <Zap className="w-16 h-16 text-white/50 absolute -right-4 -bottom-4 rotate-12" />
                    <Zap className="w-8 h-8 text-white/50 absolute left-8 top-4 -rotate-12" />
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/30 animate-bounce">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-3xl font-black text-slate-800 tracking-tight">
                            GOD MODUS AKTIVIERT ⚡
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-lg pt-2 leading-relaxed">
                            Du wurdest zum **Super Admin** ernannt! Damit hast du absolute Macht über das gesamte BoardGameHub System.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 transition-all hover:bg-amber-100/50">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Nutzer-Management</h4>
                                <p className="text-sm text-slate-600">Du kannst jeden Nutzer editieren, Rollen vergeben oder Profile löschen.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 transition-all hover:bg-blue-100/50">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Gruppen-Kontrolle</h4>
                                <p className="text-sm text-slate-600">Du kannst jede Gruppe verwalten und löschen, auch wenn du kein Mitglied bist.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100 transition-all hover:bg-purple-100/50">
                            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
                                <Dice5 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Systemweite Events</h4>
                                <p className="text-sm text-slate-600">Lösche unpassende Events oder moderiere die Sammlung der Nutzer.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-slate-800 hover:bg-black text-white font-black text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            {loading ? (
                                <span className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    VERSTANDEN, GOD MODUS AKTIVIERT! <Check className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
