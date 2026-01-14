'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Loader2, Flag } from 'lucide-react'
import { reportListing } from '@/app/marketplace/actions'
import { toast } from 'sonner' // Or native alert

interface ReportDialogProps {
    listingId: string
}

export function ReportDialog({ listingId }: ReportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason) return

        setIsLoading(true)
        const res = await reportListing(listingId, reason, description)
        setIsLoading(false)

        if (res.success) {
            setIsOpen(false)
            alert('Danke für deine Meldung. Wir werden uns das ansehen.')
            setReason('')
            setDescription('')
        } else {
            alert('Fehler: ' + res.error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-full justify-start text-sm">
                    <Flag className="w-4 h-4 mr-2" />
                    Anzeige melden
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Anzeige melden
                    </DialogTitle>
                    <DialogDescription>
                        Fällt dir etwas Verdächtiges an dieser Anzeige auf? Teile es uns mit.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Grund <span className="text-red-500">*</span></Label>
                        <Select onValueChange={setReason} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Wähle einen Grund" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spam">Spam / Werbung</SelectItem>
                                <SelectItem value="scam">Betrugsverdacht</SelectItem>
                                <SelectItem value="inappropriate">Unangemessener Inhalt</SelectItem>
                                <SelectItem value="wrong_category">Falsche Kategorie</SelectItem>
                                <SelectItem value="other">Sonstiges</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Beschreibung</Label>
                        <Textarea
                            placeholder="Gib uns weitere Details (optional)..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Abbrechen</Button>
                        <Button type="submit" variant="destructive" disabled={isLoading || !reason}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Meldung senden
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
