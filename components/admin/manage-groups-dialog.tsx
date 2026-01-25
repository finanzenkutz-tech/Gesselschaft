'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Users, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function ManageGroupsDialog({ userId, userName }: { userId: string, userName: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<any[]>([])
    const [userGroups, setUserGroups] = useState<string[]>([])
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open])

    async function fetchData() {
        setLoading(true)
        // Fetch all groups
        const { data: allGroups } = await supabase.from('groups').select('id, name').order('name')

        // Fetch user's membership
        const { data: members } = await supabase.from('group_members').select('group_id').eq('user_id', userId)

        setGroups(allGroups || [])
        setUserGroups(members?.map(m => m.group_id) || [])
        setLoading(false)
    }

    async function toggleGroup(groupId: string, isMember: boolean) {
        if (isMember) {
            // Remove
            const { error } = await supabase.from('group_members').delete().eq('user_id', userId).eq('group_id', groupId)
            if (error) toast.error('Fehler beim Entfernen')
            else {
                setUserGroups(prev => prev.filter(id => id !== groupId))
                toast.success('Aus Gruppe entfernt')
            }
        } else {
            // Add
            const { error } = await supabase.from('group_members').insert({ user_id: userId, group_id: groupId })
            if (error) toast.error('Fehler beim Hinzufügen')
            else {
                setUserGroups(prev => [...prev, groupId])
                toast.success('Zu Gruppe hinzugefügt')
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500">
                    <Users className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gruppen verwalten für {userName}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {groups.map(group => {
                            const isMember = userGroups.includes(group.id)
                            return (
                                <div key={group.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="font-bold text-slate-700">{group.name}</span>
                                    <Button
                                        size="sm"
                                        variant={isMember ? "destructive" : "default"}
                                        className={isMember ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}
                                        onClick={() => toggleGroup(group.id, isMember)}
                                    >
                                        {isMember ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </Button>
                                </div>
                            )
                        })}
                        {groups.length === 0 && <p className="text-center text-slate-400">Keine Gruppen vorhanden</p>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
