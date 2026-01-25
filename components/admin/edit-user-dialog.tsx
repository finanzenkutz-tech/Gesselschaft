'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Edit2, Loader2 } from 'lucide-react'
import { updateUserProfile } from '@/app/(app)/admin/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function EditUserDialog({ user }: { user: any }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        email: user.email || '',
        points: user.points || 0,
        nickname: user.nickname || '',
        bio: user.bio || '',
        location: user.location || '',
        favorite_games: user.favorite_games || '',
        preferences_likes: user.preferences_likes || '',
        preferences_dislikes: user.preferences_dislikes || '',
        show_reputation: user.show_reputation ?? true,
        use_nickname: user.use_nickname ?? false,
        system_role: user.system_role || 'user',
        pref_email_notifications: user.pref_email_notifications ?? true,
        pref_push_notifications: user.pref_push_notifications ?? true,
        pref_in_app_notifications: user.pref_in_app_notifications ?? true,
        is_teacher: user.is_teacher ?? false,
    })
    const router = useRouter()

    async function handleSave() {
        setLoading(true)
        const result = await updateUserProfile(user.id, formData)
        setLoading(false)
        if (result.success) {
            setOpen(false)
            router.refresh()
            toast.success('Benutzerprofil aktualisiert')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Edit2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Benutzer bearbeiten: {user.full_name || user.email}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Vollständiger Name</Label>
                            <Input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Spitzname (Nickname)</Label>
                            <Input
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>E-Mail Adresse (Auth)</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>XP / Punkte</Label>
                            <Input
                                type="number"
                                value={formData.points}
                                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="system_role_edit" id="role_label_edit">Rolle</Label>
                            <select
                                id="system_role_edit"
                                aria-labelledby="role_label_edit"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={formData.system_role}
                                onChange={(e) => setFormData({ ...formData, system_role: e.target.value })}
                            >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Standort</Label>
                            <Input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Lieblingsspiele</Label>
                            <Input
                                value={formData.favorite_games}
                                onChange={(e) => setFormData({ ...formData, favorite_games: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bio / Über mich</Label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="h-24"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mag ich (Preferences)</Label>
                            <Input
                                value={formData.preferences_likes}
                                onChange={(e) => setFormData({ ...formData, preferences_likes: e.target.value })}
                                placeholder="z.B. Strategie, Snacks..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mag ich nicht</Label>
                            <Input
                                value={formData.preferences_dislikes}
                                onChange={(e) => setFormData({ ...formData, preferences_dislikes: e.target.value })}
                                placeholder="z.B. Zeitdruck, Lärm..."
                            />
                        </div>

                        <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="use_nickname_admin" className="cursor-pointer">Nickname öffentlich nutzen</Label>
                                <Switch
                                    id="use_nickname_admin"
                                    checked={formData.use_nickname}
                                    onCheckedChange={(checked) => setFormData({ ...formData, use_nickname: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show_reputation_admin" className="cursor-pointer">Reputation anzeigen</Label>
                                <Switch
                                    id="show_reputation_admin"
                                    checked={formData.show_reputation}
                                    onCheckedChange={(checked) => setFormData({ ...formData, show_reputation: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_teacher_admin" className="cursor-pointer font-bold text-indigo-600">Als Lehrer markieren</Label>
                                <Switch
                                    id="is_teacher_admin"
                                    checked={formData.is_teacher}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_teacher: checked })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Benachrichtigungen</p>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">E-Mail</Label>
                                <Switch
                                    checked={formData.pref_email_notifications}
                                    onCheckedChange={(checked) => setFormData({ ...formData, pref_email_notifications: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Push</Label>
                                <Switch
                                    checked={formData.pref_push_notifications}
                                    onCheckedChange={(checked) => setFormData({ ...formData, pref_push_notifications: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">In-App</Label>
                                <Switch
                                    checked={formData.pref_in_app_notifications}
                                    onCheckedChange={(checked) => setFormData({ ...formData, pref_in_app_notifications: checked })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Speichern
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
