'use client'

import { useState } from 'react'
import { Upload, FileType, Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addGameToInventory } from '@/app/inventory/actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

export function CSVImportClient({ groups }: { groups: any[] }) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
            setError(null)
        }
    }

    const processCSV = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        setProgress(0)

        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)

        // Simple header detection
        const hasHeader = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('title')
        const dataLines = hasHeader ? lines.slice(1) : lines
        const total = dataLines.length

        if (total === 0) {
            setError('Keine Daten in der Datei gefunden.')
            setLoading(false)
            return
        }

        setStatus(`Verarbeite ${total} Spiele...`)

        let successCount = 0
        for (let i = 0; i < total; i++) {
            const line = dataLines[i]
            // Simple split (handles comma or semicolon)
            const parts = line.split(/[;,]/)
            const name = parts[0]?.replace(/"/g, '').trim()
            const bggId = parts[1]?.replace(/"/g, '').trim()

            if (name) {
                const formData = new FormData()
                formData.set('name', name)
                if (bggId && !isNaN(parseInt(bggId))) {
                    formData.set('bgg_link', `https://boardgamegeek.com/boardgame/${bggId}`)
                }
                formData.set('visibility', 'groups')

                try {
                    await addGameToInventory(formData)
                    successCount++
                } catch (e) {
                    console.error('Failed to add:', name)
                }
            }

            setProgress(Math.round(((i + 1) / total) * 100))
        }

        setLoading(false)
        setStatus(`Fertig! ${successCount} von ${total} Spielen importiert.`)

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        })

        setTimeout(() => {
            router.refresh()
            router.push('/inventory')
        }, 3000)
    }

    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center space-y-4 hover:border-primary/50 transition-colors bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-slate-400">
                    <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-slate-700">CSV-Datei auswählen</p>
                    <p className="text-xs text-slate-500">Klick zum Durchsuchen oder Drag & Drop</p>
                </div>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                    disabled={loading}
                />
                <Button
                    variant="outline"
                    asChild
                    className="rounded-xl font-bold"
                    disabled={loading}
                >
                    <label htmlFor="csv-upload" className="cursor-pointer">Datei wählen</label>
                </Button>
            </div>

            {file && (
                <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <FileType className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">{file.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Importiere...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {status && !loading && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 font-bold border border-emerald-100 animate-in fade-in scale-in-95">
                    <Check className="w-5 h-5" />
                    {status}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 font-bold border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <Button
                onClick={processCSV}
                disabled={!file || loading}
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl shadow-slate-200"
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 w-5 h-5" />}
                Import starten
            </Button>
        </div>
    )
}
