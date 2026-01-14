'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { subscribeToPush, unsubscribeFromPush, getVapidPublicKey } from '@/app/push/actions'

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkSupport()
    }, [])

    async function checkSupport() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setIsSupported(false)
            setIsLoading(false)
            return
        }

        setIsSupported(true)

        try {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
                const subscription = await registration.pushManager.getSubscription()
                setIsSubscribed(!!subscription)
            }
        } catch (e) {
            console.error('Error checking push status:', e)
        }

        setIsLoading(false)
    }

    async function handleSubscribe() {
        setIsLoading(true)
        setError(null)

        try {
            // Register service worker if not already
            let registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js')
                await navigator.serviceWorker.ready
            }

            // Get VAPID key
            const vapidKey = await getVapidPublicKey()
            if (!vapidKey) {
                throw new Error('Push-Benachrichtigungen sind nicht konfiguriert')
            }

            // Request permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                throw new Error('Benachrichtigungen wurden abgelehnt')
            }

            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })

            const subJson = subscription.toJSON()
            const result = await subscribeToPush({
                endpoint: subJson.endpoint!,
                keys: {
                    auth: subJson.keys!.auth!,
                    p256dh: subJson.keys!.p256dh!
                }
            }, navigator.userAgent)

            if (result.success) {
                setIsSubscribed(true)
            } else {
                throw new Error(result.error)
            }
        } catch (e: any) {
            console.error('Subscribe error:', e)
            setError(e.message || 'Fehler beim Aktivieren')
        }

        setIsLoading(false)
    }

    async function handleUnsubscribe() {
        setIsLoading(true)
        setError(null)

        try {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
                const subscription = await registration.pushManager.getSubscription()
                if (subscription) {
                    await subscription.unsubscribe()
                    await unsubscribeFromPush(subscription.endpoint)
                }
            }
            setIsSubscribed(false)
        } catch (e: any) {
            console.error('Unsubscribe error:', e)
            setError(e.message || 'Fehler beim Deaktivieren')
        }

        setIsLoading(false)
    }

    if (!isSupported) {
        return (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-slate-500">
                <AlertCircle className="w-5 h-5" />
                <div>
                    <p className="font-bold text-sm">Push nicht verfügbar</p>
                    <p className="text-xs">Dein Browser unterstützt keine Push-Benachrichtigungen.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isSubscribed ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubscribed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">Push-Benachrichtigungen</p>
                        <p className="text-xs text-slate-500">
                            {isSubscribed ? 'Aktiv – du erhältst Benachrichtigungen' : 'Inaktiv – aktiviere für Updates'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    disabled={isLoading}
                    variant={isSubscribed ? "outline" : "default"}
                    className={`rounded-xl ${isSubscribed ? 'hover:text-red-500' : 'bg-primary hover:bg-blue-600'}`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSubscribed ? (
                        'Deaktivieren'
                    ) : (
                        'Aktivieren'
                    )}
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {isSubscribed && (
                <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    Du erhältst Benachrichtigungen für Events, Nachrichten und mehr.
                </div>
            )}
        </div>
    )
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
