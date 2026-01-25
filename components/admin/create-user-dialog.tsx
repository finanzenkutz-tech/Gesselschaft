'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2 } from 'lucide-react'
import { createUserAdmin } from '@/app/(app)/admin/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [formData, setFormData] = useState({
        full_name: '',
        nickname: '',
        bio: '',
        location: '',
        favorite_games: '',
        show_reputation: true,
        use_nickname: false,
        system_role: 'user',
        pref_email_notifications: true,
        pref_push_notifications: true,
        pref_in_app_notifications: true,
        is_teacher: false,
    })
    const router = useRouter()

    async function handleCreate() {
        if (!email || !password) {
            toast.error('E-Mail und Passwort sind erforderlich')
            return
        }
        setLoading(true)
        const result = await createUserAdmin(email, password, formData)
        setLoading(false)
        if (result.success) {
            setOpen(false)
            router.refresh()
            toast.success('Benutzer erfolgreich erstellt')
            // Reset
            setEmail('')
            setPassword('')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Nutzer erstellen
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Login Daten</p>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail Adresse</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@beispiel.de"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Passwort</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Min. 6 Zeichen"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Vollständiger Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nickname">Spitzname</Label>
                            <Input
                                id="nickname"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="system_role_create" id="role_label_create">Rolle</Label>
                            <select
                                id="system_role_create"
                                aria-labelledby="role_label_create"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={formData.system_role}
                                onChange={(e) => setFormData({ ...formData, system_role: e.target.value })}
                            >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Standort</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="use_nickname_create" className="cursor-pointer">Nickname öffentlich nutzen</Label>
                                <Switch
                                    id="use_nickname_create"
                                    checked={formData.use_nickname}
                                    onCheckedChange={(checked) => setFormData({ ...formData, use_nickname: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show_reputation_create" className="cursor-pointer">Reputation anzeigen</Label>
                                <Switch
                                    id="show_reputation_create"
                                    checked={formData.show_reputation}
                                    onCheckedChange={(checked) => setFormData({ ...formData, show_reputation: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_teacher_create" className="cursor-pointer font-bold text-indigo-600">Als Lehrer markieren</Label>
                                <Switch
                                    id="is_teacher_create"
                                    checked={formData.is_teacher}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_teacher: checked })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Nutzer anlegen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
