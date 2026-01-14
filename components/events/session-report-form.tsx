'use client'

import { useState } from 'react'
import { Camera, Trophy, FileText, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addSessionReport } from '@/app/events/session-actions'
import { useRouter } from 'next/navigation'

interface SessionReportFormProps {
    sessionId: string
    attendees: { user_id: string; profiles: { full_name: string } }[]
    eventId: string
}

export function SessionReportForm({ sessionId, attendees, eventId }: SessionReportFormProps) {
    const [reportText, setReportText] = useState('')
    const [winnerId, setWinnerId] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        await addSessionReport(sessionId, {
            report_text: reportText,
            winner_id: winnerId || null,
            report_image_url: imageUrl || null
        })

        setLoading(false)
        router.refresh()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Spielbericht hinzufügen
            </h4>

            <div className="space-y-3">
                <Input
                    placeholder="Wie wars? Wer hat gewonnen? 🎲"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="rounded-xl h-12"
                />

                <div className="flex gap-2">
                    <select
                        value={winnerId}
                        onChange={(e) => setWinnerId(e.target.value)}
                        className="flex-1 h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm"
                    >
                        <option value="">🏆 Gewinner auswählen...</option>
                        {attendees.map(a => (
                            <option key={a.user_id} value={a.user_id}>
                                {a.profiles?.full_name || 'Unbekannt'}
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    placeholder="Bild-URL (optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="rounded-xl h-12"
                />
            </div>

            <Button
                type="submit"
                disabled={loading || !reportText.trim()}
                className="w-full rounded-xl h-12 bg-primary hover:bg-blue-600"
            >
                {loading ? 'Wird gespeichert...' : 'Bericht speichern'}
            </Button>
        </form>
    )
}
