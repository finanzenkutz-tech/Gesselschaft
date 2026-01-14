'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { deleteAccount } from '@/app/profile/actions'

export function DeleteAccountButton() {
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleDelete() {
        if (confirmText !== 'LÖSCHEN') return

        setLoading(true)
        setError(null)

        try {
            const result = await deleteAccount()
            if (result.success) {
                router.push('/login')
            } else {
                setError(result.error || 'Fehler beim Löschen')
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
                <Button variant="outline" className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl h-12 font-bold">
                    <Trash2 className="w-5 h-5 mr-2" />
                    Account löschen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white">
                    <DialogTitle className="text-xl font-extrabold flex items-center gap-3">
                        <AlertTriangle className="w-7 h-7" />
                        Account löschen
                    </DialogTitle>
                    <DialogDescription className="text-red-100 mt-2">
                        Diese Aktion kann nicht rückgängig gemacht werden!
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm space-y-2">
                        <p className="font-bold">Folgendes wird gelöscht:</p>
                        <ul className="list-disc list-inside space-y-1 text-red-600">
                            <li>Dein Profil und alle Daten</li>
                            <li>Deine Gruppen-Mitgliedschaften</li>
                            <li>Deine Spielesammlung</li>
                            <li>Deine Buddies</li>
                            <li>Alle Event-Teilnahmen</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                            Tippe <span className="text-red-500">LÖSCHEN</span> um zu bestätigen
                        </label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="LÖSCHEN"
                            className="rounded-xl bg-slate-50 border-slate-100 h-12 text-center font-bold tracking-widest"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="flex-1 rounded-xl h-12 font-bold"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={confirmText !== 'LÖSCHEN' || loading}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold disabled:opacity-50"
                        >
                            {loading ? 'Wird gelöscht...' : 'Endgültig löschen'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
