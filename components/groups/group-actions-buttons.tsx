'use client'

import { useState } from 'react'
import { UserPlus, LogOut, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinGroup, leaveGroup } from '@/app/groups/member-actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function GroupJoinButton({ groupId }: { groupId: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const router = useRouter()

    async function handleJoin() {
        setStatus('loading')
        try {
            const result = await joinGroup(groupId)
            if (result.success) {
                setStatus('success')
                router.refresh()
                // Reset after 2 seconds to show "Verlassen" if the page didn't refresh fast enough
                setTimeout(() => setStatus('idle'), 2000)
            } else {
                setStatus('error')
                setErrorMessage(result.error || 'Fehler beim Beitritt')
            }
        } catch (err: any) {
            setStatus('error')
            setErrorMessage(err.message || 'Verbindungsfehler')
        }
    }

    if (status === 'success') {
        return (
            <Button disabled className="bg-green-500 text-white rounded-xl shadow-lg shadow-green-200">
                <Check className="w-4 h-4 mr-2" /> Beigetreten
            </Button>
        )
    }

    return (
        <div className="flex flex-col items-end">
            <Button
                onClick={handleJoin}
                disabled={status === 'loading'}
                className="bg-primary hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 min-w-[120px]"
            >
                {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <UserPlus className="w-4 h-4 mr-2" /> Beitreten
                    </>
                )}
            </Button>
            {status === 'error' && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errorMessage}</p>
            )}
        </div>
    )
}

export function GroupLeaveButton({ groupId }: { groupId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleLeave() {
        if (!confirm('Möchtest du die Gruppe wirklich verlassen?')) return
        setLoading(true)
        try {
            const result = await leaveGroup(groupId)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        } catch (err) {
            alert('Netzwerkfehler')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleLeave}
            disabled={loading}
            variant="outline"
            className="border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" /> Verlassen</>}
        </Button>
    )
}
