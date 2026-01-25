'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Euro, Send, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createOffer } from '@/app/(app)/marketplace/actions'

interface OfferDialogProps {
    listingId: string
    listingTitle: string
    currentPrice: number | null
    isForRent?: boolean
}

export function OfferDialog({ listingId, listingTitle, currentPrice, isForRent }: OfferDialogProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState(currentPrice?.toString() || '')
    const [message, setMessage] = useState('')
    const [isRental, setIsRental] = useState(isForRent || false)
    const [returnDate, setReturnDate] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await createOffer(listingId, parseFloat(amount), message, isRental, returnDate || null)
            if (res.success) {
                toast.success(isRental ? 'Leihanfrage erfolgreich gesendet!' : 'Preisvorschlag erfolgreich gesendet!')
                setOpen(false)
                setMessage('')
                setReturnDate('')
            } else {
                toast.error(res.error || 'Fehler beim Senden')
            }
        } catch (error) {
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={isForRent ? "default" : "outline"} className={`w-full gap-2 ${!isForRent ? 'border-primary text-primary hover:bg-primary/5' : 'bg-orange-500 hover:bg-orange-600'}`}>
                    {isForRent ? <Calendar className="w-4 h-4" /> : <Euro className="w-4 h-4" />}
                    {isForRent ? 'Miet-Anfrage stellen' : 'Preisvorschlag senden'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isRental ? 'Leihanfrage' : 'Preisvorschlag'} für "{listingTitle}"</DialogTitle>
                        <DialogDescription>
                            {isRental
                                ? 'Schlage eine Gebühr und ein Rückgabedatum vor.'
                                : 'Sende dem Verkäufer ein faires Angebot. Er kann dieses annehmen oder ablehnen.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">{isRental ? 'Leihgebühr (€)' : 'Dein Angebot (€)'}</Label>
                            <div className="relative">
                                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.50"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-9"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        {isRental && (
                            <div className="space-y-2">
                                <Label htmlFor="returnDate">Geplantes Rückgabedatum</Label>
                                <Input
                                    id="returnDate"
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="message">Nachricht ({isRental ? 'z.B. Abholung' : 'optional'})</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={isRental ? "Wann möchtest du das Spiel abholen?" : "Hallo, ich hätte Interesse..."}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full gap-2">
                            {loading ? 'Wird gesendet...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    {isRental ? 'Anfrage senden' : 'Angebot senden'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

