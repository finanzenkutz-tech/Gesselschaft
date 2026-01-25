'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, UserX, Loader2, Trash2, ShieldCheck } from 'lucide-react'
import { updateNotificationSettings, unmuteUser } from '@/app/settings/user-settings-actions'
import { savePushSubscription, removePushSubscription } from '@/app/notifications/push-actions'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// NOTE: Hardcoded public key because we are in a dev environment and user setup is instant
const VAPID_PUBLIC_KEY = 'BEPRCyhBxKYKeLQiC3R_OGFzMI2Fno0WzMcaUEoLk-hNQ7KZwwa-ceFvIvAUZWNVL9iNNxkNd6Vn'

interface MutedUser {
    id: string
    full_name: string | null
    avatar_url: string | null
}

interface NotificationSettingsProps {
    initialEnabled: boolean
    mutedUsers: MutedUser[]
}

export function NotificationSettings({ initialEnabled, mutedUsers: initialMutedUsers }: NotificationSettingsProps) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [mutedUsers, setMutedUsers] = useState<MutedUser[]>(initialMutedUsers)
    const [loading, setLoading] = useState(false)

    const handleToggle = async (val: boolean) => {
        setLoading(true)
        try {
            await updateNotificationSettings(val)

            if (val) {
                // ENABLE: Subscribe to Push
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });

                    // Save to backend
                    const saveRes = await savePushSubscription(JSON.parse(JSON.stringify(subscription)));
                    if (!saveRes.success) {
                        console.error('Failed to save subscription:', saveRes.error);
                        toast.error("Browser-Push konnte nicht aktiviert werden");
                        // Don't revert the switch, but warn
                    } else {
                        toast.success("Push-Benachrichtigungen aktiviert");
                    }
                } else {
                    toast.warning("Dein Browser unterstützt keine Push-Benachrichtigungen");
                }
            } else {
                // DISABLE: Unsubscribe from Push
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        // Remove from backend first
                        await removePushSubscription(subscription.endpoint);
                        // Then unsubscribe locally
                        await subscription.unsubscribe();
                    }
                }
                toast.success("Benachrichtigungen deaktiviert");
            }

            setEnabled(val)
        } catch (err: any) {
            console.error(err);
            toast.error("Fehler beim Speichern: " + err.message)
            // Revert state on error
            // setEnabled(!val) // Optional, but confusing if it was partial success
        } finally {
            setLoading(false)
        }
    }

    const handleUnmute = async (userId: string) => {
        try {
            await unmuteUser(userId)
            setMutedUsers(prev => prev.filter((u: MutedUser) => u.id !== userId))
            toast.success("Stummschaltung aufgehoben")
        } catch (err) {
            toast.error("Fehler beim Aufheben der Stummschaltung")
        }
    }

    return (
        <div className="space-y-8">
            <div className="sky-card p-6 flex items-center justify-between border-primary/10 bg-gradient-to-br from-white to-blue-50/30">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${enabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                        {enabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Push-Benachrichtigungen</h3>
                        <p className="text-xs text-slate-500 font-medium">Chat-Nachrichten und Event-Updates</p>
                    </div>
                </div>
                <Switch
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={loading}
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <UserX className="w-3 h-3" /> Stummgeschaltete Spieler ({mutedUsers.length})
                </h3>

                <div className="sky-card overflow-hidden">
                    {mutedUsers.length === 0 ? (
                        <div className="p-8 text-center bg-white/50">
                            <p className="text-sm text-slate-400 font-medium italic">Keine Spieler stummgeschaltet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 bg-white">
                            {mutedUsers.map((user) => (
                                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border border-slate-100">
                                            <AvatarImage src={user.avatar_url || undefined} />
                                            <AvatarFallback className="bg-slate-50 text-slate-500 font-bold">
                                                {user.full_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Stummgeschaltet</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnmute(user.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Stummschaltung aufheben"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
