'use client'

import { useState } from 'react'
import { User, Mail, Shield, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserProfile, deleteUser } from '@/app/(app)/admin/actions'
import { useRouter } from 'next/navigation'
import { ManageGroupsDialog } from './manage-groups-dialog'

export function AdminUserTable({ users, godMode }: { users: any[], godMode?: boolean }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSave(userId: string) {
        setLoading(true)
        const result = await updateUserProfile(userId, editData)
        setLoading(false)
        if (result.success) {
            setEditingId(null)
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm('Benutzer wirklich löschen? Dies entfernt das Profil.')) return
        setLoading(true)
        const result = await deleteUser(userId)
        setLoading(false)
        if (result.success) {
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-sm uppercase tracking-wider">
                        <th className="py-4 px-6 font-bold">Benutzer</th>
                        <th className="py-4 px-6 font-bold">Rolle</th>
                        <th className="py-4 px-6 font-bold">Beigetreten</th>
                        <th className="py-4 px-6 font-bold text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                        {user.full_name?.[0] || user.email?.[0] || '?'}
                                    </div>
                                    <div>
                                        {editingId === user.id ? (
                                            <div className="space-y-1">
                                                <Input
                                                    className="h-8 text-sm font-bold w-40"
                                                    placeholder="Name"
                                                    defaultValue={user.full_name}
                                                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                                />
                                                <Input
                                                    className="h-8 text-xs w-40"
                                                    placeholder="Nickname"
                                                    defaultValue={user.nickname}
                                                    onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-bold text-slate-700">
                                                    {user.full_name || 'Anonym'}
                                                    {user.nickname && <span className="text-slate-400 ml-1 font-normal">({user.nickname})</span>}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                            <Mail className="w-3 h-3" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                {editingId === user.id ? (
                                    <select
                                        className="text-xs font-bold bg-slate-100 border-none rounded-lg p-1"
                                        defaultValue={user.system_role}
                                        onChange={(e) => setEditData({ ...editData, system_role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                ) : (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.system_role === 'super_admin' ? 'bg-amber-100 text-amber-600' :
                                        user.system_role === 'moderator' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <Shield className="w-3 h-3" />
                                        {user.system_role}
                                    </span>
                                )}
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-500">
                                {new Date(user.created_at).toLocaleDateString('de-DE')}
                            </td>
                            <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {godMode && !editingId && (
                                        <ManageGroupsDialog userId={user.id} userName={user.full_name} />
                                    )}

                                    {editingId === user.id ? (
                                        <>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-emerald-500 hover:bg-emerald-50"
                                                onClick={() => handleSave(user.id)}
                                                disabled={loading}
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                                                onClick={() => setEditingId(null)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => {
                                                    setEditingId(user.id)
                                                    setEditData({ full_name: user.full_name, nickname: user.nickname, system_role: user.system_role })
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => handleDelete(user.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
