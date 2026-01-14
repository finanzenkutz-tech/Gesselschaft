'use client'

import { useState } from 'react'
import { Lightbulb, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { createFeatureRequest } from '@/app/features/actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

export function FeatureRequestForm() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await createFeatureRequest(formData)

        setLoading(false)

        if (result.success) {
            setOpen(false)

            // Fire confetti! 🎉
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#f97316', '#3b82f6', '#10b981', '#8b5cf6']
            })

            // Also fire from the sides for extra effect
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                })
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                })
            }, 200)

            router.refresh()
        } else {
            setError(result.error || 'Fehler beim Speichern')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-blue-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-blue-200">
                    <Plus className="w-5 h-5 mr-2" /> Idee einreichen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 text-white">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Lightbulb className="w-8 h-8" /> Neue Idee
                    </DialogTitle>
                    <DialogDescription className="text-yellow-50 mt-2 opacity-90">
                        Welche Funktion fehlt dir? Beschreibe deine Idee!
                    </DialogDescription>
                </div>
                <form action={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Titel *</label>
                            <Input
                                name="title"
                                placeholder="z.B. Wunschliste für Spiele"
                                required
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Beschreibung (optional)</label>
                            <Textarea
                                name="description"
                                placeholder="Erkläre die Idee genauer..."
                                className="rounded-xl bg-slate-50 border-slate-100 min-h-[100px]"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-yellow-200 disabled:opacity-50"
                    >
                        {loading ? 'Wird gespeichert...' : 'Idee einreichen'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
