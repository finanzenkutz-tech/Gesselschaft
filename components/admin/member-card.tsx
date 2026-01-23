'use client'

import { useState } from 'react'
import { Users, Shield, Trophy, Edit2, Trash2, Check, X, Mail, Key, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteUser, updateUserProfile, sendPasswordReset } from '@/app/(app)/admin/actions'
import { getLevelInfo } from '@/lib/utils/gamification'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface MemberCardProps {
    profile: any
    index: number
    currentUserId: string
}

export function MemberCard({ profile, index, currentUserId }: MemberCardProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState(profile.system_role || 'user')
    const [showPasswordHint, setShowPasswordHint] = useState(false)

    const levelInfo = getLevelInfo(profile.points || 0)
    const isSuperAdmin = profile.system_role === 'super_admin'
    const isCurrentUser = profile.id === currentUserId

    const handleSaveRole = async () => {
        setLoading(true)
        const result = await updateUserProfile(profile.id, { system_role: selectedRole })
        if (result.success) {
            toast.success('Rolle erfolgreich geändert!')
            setIsEditing(false)
        } else {
            toast.error('Fehler: ' + result.error)
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm(`Möchtest du "${profile.full_name || profile.email}" wirklich löschen?`)) return

        setLoading(true)
        const result = await deleteUser(profile.id)
        if (result.success) {
            toast.success('Nutzer gelöscht!')
            router.refresh()
        } else {
            toast.error('Fehler: ' + result.error)
        }
        setLoading(false)
    }

    const handlePasswordReset = async () => {
        setLoading(true)
        const result = await sendPasswordReset(profile.email)
        if (result.success) {
            toast.success('Passwort-Reset wurde gesendet!')
            setShowPasswordHint(false)
        } else {
            toast.error('Fehler: ' + result.error)
        }
        setLoading(false)
    }

    const lastSeenDate = profile.last_seen ? new Date(profile.last_seen) : null
    const isOnline = lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 5 * 60 * 1000) // 5 minutes

    const formatLastSeen = (date: Date) => {
        const diff = new Date().getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 5) return 'Jetzt online'
        if (minutes < 60) return `Vor ${minutes} Min.`
        if (hours < 24) return `Vor ${hours} Std.`
        return `Vor ${days} Tagen`
    }

    return (
        <div className="sky-card p-6 flex flex-col gap-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            {/* Rank Badge for Top 3 */}
            {index < 3 && (
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className={`w-24 h-24 ${index === 0 ? 'text-amber-500' :
                        index === 1 ? 'text-slate-400' :
                            'text-amber-700'
                        }`} />
                </div>
            )}

            {/* Edit/Delete Actions */}
            <div className="absolute top-4 right-4 flex gap-1 z-20 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-md border border-slate-100">
                {!isEditing ? (
                    <>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-blue-50"
                            onClick={() => setIsEditing(true)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? "Du kannst dich selbst nicht bearbeiten" : "Bearbeiten"}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={loading || isCurrentUser}
                            title={isCurrentUser ? "Du kannst dich selbst nicht löschen" : "Löschen"}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-500 hover:bg-emerald-50"
                            onClick={handleSaveRole}
                            disabled={loading}
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                            onClick={() => { setIsEditing(false); setSelectedRole(profile.system_role || 'user') }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </>
                )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 shrink-0 uppercase">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                        profile.full_name?.[0] || '?'
                    )}
                </div>
                <div className="min-w-0">
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight truncate">
                        {profile.full_name || 'Unbekannt'}
                    </h3>
                    <div className="flex flex-col gap-1">
                        <p className="text-slate-400 text-sm truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {profile.email}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Circle className={`w-2 h-2 fill-current ${isOnline ? 'text-green-500' : 'text-slate-300'}`} />
                            <span className={isOnline ? 'text-green-600' : 'text-slate-400'}>
                                {lastSeenDate ? formatLastSeen(lastSeenDate) : 'Nie online'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Badge / Editor */}
            <div className="flex items-center gap-2 mt-2">
                {isEditing ? (
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="user">Spieler</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                ) : (
                    isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                            <Shield className="w-3 h-3" />
                            Super Admin
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                            <Users className="w-3 h-3" />
                            Spieler
                        </span>
                    )
                )}
            </div>

            {/* Password Section */}
            <div className="flex items-center justify-between gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 mt-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                        <Key className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-mono text-xs text-slate-400">••••••••</span>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-amber-600 border-amber-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all shadow-sm"
                    onClick={handlePasswordReset}
                    disabled={loading || isCurrentUser}
                    title="Passwort-Reset Link senden"
                >
                    <Mail className="w-3 h-3 mr-1.5" />
                    Reset
                </Button>
            </div>

            {/* Admin Actions Section */}
            <div className="mt-auto pt-4 border-t border-slate-50 space-y-3">
                <Button
                    variant="ghost"
                    className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 font-bold text-xs h-9"
                    onClick={handleDelete}
                    disabled={loading || isCurrentUser}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Mitglied löschen
                </Button>

                <div className="h-px bg-slate-50 w-full" />

                {/* Level Info */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-bold uppercase">Level {levelInfo.level}</span>
                        <span className="font-bold text-primary">{levelInfo.rank}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 text-xs font-bold uppercase">XP</span>
                        <span className="block font-black text-slate-800">{profile.points || 0}</span>
                    </div>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-blue-400"
                        style={{ width: `${levelInfo.progress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
