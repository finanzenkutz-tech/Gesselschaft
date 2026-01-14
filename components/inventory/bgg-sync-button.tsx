'use client'

import { useState } from 'react'
import { RefreshCw, Check, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { syncBGGCollection } from '@/app/inventory/bgg-sync-actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

interface BGGSyncButtonProps {
    savedUsername?: string
}

export function BGGSyncButton({ savedUsername }: BGGSyncButtonProps) {
    const [open, setOpen] = useState(false)
    const [username, setUsername] = useState(savedUsername || '')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; imported?: number } | null>(null)
    const router = useRouter()

    const handleSync = async () => {
        if (!username.trim()) return

        setLoading(true)
        setResult(null)

        const syncResult = await syncBGGCollection(username.trim())

        setLoading(false)

        if (syncResult.success && syncResult.imported && syncResult.imported > 0) {
            setResult({
                success: true,
                message: `${syncResult.imported} Spiele importiert!`,
                imported: syncResult.imported
            })

            // Celebration! 🎉
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })

            setTimeout(() => {
                setOpen(false)
                router.refresh()
            }, 2000)
        } else if (syncResult.success && syncResult.imported === 0) {
            setResult({
                success: true,
                message: 'Alle Spiele bereits importiert!',
                imported: 0
            })
        } else {
            setResult({
                success: false,
                message: syncResult.error || 'Fehler beim Import'
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2">
                    <Download className="w-4 h-4" />
                    BGG Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                    <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                        <RefreshCw className="w-6 h-6" />
                        BoardGameGeek Sync
                    </DialogTitle>
                    <DialogDescription className="text-orange-100 mt-1">
                        Importiere deine Spielesammlung automatisch von BGG.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">BGG Benutzername</label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Dein BGG Username..."
                            className="rounded-xl h-12"
                        />
                        <p className="text-xs text-slate-500">
                            Deine Sammlung muss öffentlich sichtbar sein.
                        </p>
                    </div>

                    {result && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {result.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-medium">{result.message}</span>
                        </div>
                    )}

                    <Button
                        onClick={handleSync}
                        disabled={loading || !username.trim()}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-bold"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Importiere...
                            </>
                        ) : (
                            'Sammlung importieren'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
