'use client'

import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Scan, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function BarcodeScannerDialog({ onScan }: { onScan: (decodedText: string) => void }) {
    const [open, setOpen] = useState(false)
    const [scanning, setScanning] = useState(false)

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null

        if (open) {
            // Include slight delay to ensure DOM is ready
            setTimeout(() => {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
                )

                scanner.render((decodedText) => {
                    onScan(decodedText)
                    setOpen(false)
                    toast.success(`Code erkannt: ${decodedText}`)
                    scanner?.clear()
                }, (error) => {
                    console.warn(error)
                })
            }, 100)
        }

        return () => {
            if (scanner) {
                try {
                    scanner.clear()
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    }, [open, onScan])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Scan</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Barcode scannen</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    <div id="reader" className="w-full max-w-sm overflow-hidden rounded-lg"></div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                        Halte den Barcode des Spiels vor die Kamera.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
