'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { startMarketplaceChat } from '@/app/marketplace/actions'

interface ContactSellerButtonProps {
    listingId: string
    sellerId: string
    sellerName: string
    isOwner: boolean
}

export function ContactSellerButton({ listingId, sellerId, sellerName, isOwner }: ContactSellerButtonProps) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('Hallo, ich habe Interesse an deinem Angebot. Ist es noch verfügbar?')
    const [isLoading, setIsLoading] = useState(false)

    if (isOwner) return null

    const handleSend = async () => {
        setIsLoading(true)
        try {
            const res = await startMarketplaceChat(listingId, sellerId, message)
            if (res && res.error) {
                alert(res.error)
            } else {
                setOpen(false)
            }
        } catch (error) {
            console.error(error)
            // redirect happens in action, so error might be caught here if redirect fails or is treated as error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full font-bold shadow-lg shadow-blue-200" size="lg">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Verkäufer kontaktieren
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nachricht an {sellerName}</DialogTitle>
                    <DialogDescription>
                        Starte einen Chat, um Details zu klären oder einen Treffpunkt zu vereinbaren.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="font-medium"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button onClick={handleSend} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Nachricht senden
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
