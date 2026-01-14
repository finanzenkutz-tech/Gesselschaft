'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users } from 'lucide-react'
import { createGroup } from '@/app/groups/actions'
import confetti from 'canvas-confetti'
import { useRouter } from 'next/navigation'

export function CreateGroupDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        try {
            const result = await createGroup(formData) as any
            if (result?.success === false) {
                setError(result.error)
                setLoading(false)
                return
            }

            // Fire confetti! 🎉
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
            })

            setOpen(false)
            router.refresh()
        } catch (e: any) {
            // Next.js uses errors for redirects. If we catch it, the redirect fails.
            if (e.message && (e.message.includes('NEXT_REDIRECT') || e.digest?.includes('NEXT_REDIRECT'))) {
                throw e
            }
            console.error('Action error:', e)
            setError('Gruppe konnte nicht erstellt werden')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-blue-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-blue-200">
                    <Plus className="w-5 h-5 mr-2" /> Gruppe erstellen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Users className="w-8 h-8" /> Neue Gruppe
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        Gründe eine neue Spielrunde und lade deine Freunde ein.
                    </DialogDescription>
                </div>
                <form action={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Name der Gruppe *</label>
                            <Input
                                name="name"
                                placeholder="z.B. Die Würfelhelden"
                                required
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Beschreibung</label>
                            <Textarea
                                name="description"
                                placeholder="Was spielt ihr am liebsten?"
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
                        className="w-full bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                        {loading ? 'Wird erstellt...' : 'Gruppe erstellen'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
