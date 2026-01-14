'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/app/actions'
import { Dice5, CheckCircle2 } from 'lucide-react'

export function OnboardingModal({ show }: { show: boolean }) {
    const [open, setOpen] = useState(show)

    const handleClose = async () => {
        await completeOnboarding()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white relative">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                            <Dice5 className="w-8 h-8" /> Willkommen im Hub!
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 mt-2 opacity-90">
                            Wir freuen uns, dich dabei zu haben. Dies ist dein neues Zuhause für die Organisation von Spieleabenden, Fahrgemeinschaften und deiner Spielesammlung.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8">
                    <ul className="space-y-4">
                        {[
                            'Spielegruppen erstellen und beitreten',
                            'Events planen und Teilnehmer verwalten',
                            'Einfache Organisation von Fahrgemeinschaften',
                            'Über neue Features abstimmen'
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <DialogFooter className="p-8 pt-0">
                    <Button
                        onClick={handleClose}
                        className="w-full bg-primary hover:bg-blue-600 text-white rounded-2xl h-12 font-bold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Lass uns spielen!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
