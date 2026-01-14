'use client'

import { useState } from 'react'
import { Settings, Users, Plus, X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateGroup } from '@/app/groups/actions'
import { useRouter } from 'next/navigation'

type Group = {
    id: string
    name: string
    description: string | null
}

export function EditGroupDialog({ group }: { group: Group }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        formData.append('id', group.id)

        try {
            const result = await updateGroup(formData)
            if (result.success) {
                setOpen(false)
                router.refresh()
            } else {
                setError(result.error || 'Fehler beim Aktualisieren')
            }
        } catch (e) {
            setError('Netzwerkfehler')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-2 border-slate-100 text-slate-600 rounded-xl hover:bg-slate-50 transition-all group">
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="ml-2 hidden sm:inline">Gruppe bearbeiten</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                        <Settings className="w-8 h-8" /> Gruppe bearbeiten
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 opacity-90">
                        Passe den Namen und die Beschreibung deiner Gruppe an.
                    </DialogDescription>
                </div>

                <form action={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-1">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Gruppenname
                            </label>
                            <Input
                                name="name"
                                defaultValue={group.name}
                                placeholder="z.B. Die Würfel-Räuber"
                                required
                                className="rounded-xl bg-slate-50 border-slate-100 h-12 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-secondary" /> Beschreibung
                            </label>
                            <Textarea
                                name="description"
                                defaultValue={group.description || ''}
                                placeholder="Was zeichnet eure Gruppe aus?"
                                className="rounded-xl bg-slate-50 border-slate-100 min-h-[120px] focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 rounded-xl h-12 font-bold text-slate-500"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200 transition-all"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Speichere...</span>
                                </div>
                            ) : 'Änderungen speichern'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
