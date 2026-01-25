'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/profile/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { MapPin, Gamepad2, Tag, Shield, Home, Coffee, Bell } from 'lucide-react'

interface PersonalDetailsFormProps {
    initialBio: string | null
    initialLocation: string | null
    initialFavoriteGames: string | null
    initialPlayStyleTags: string[] | null
    initialShowReputation: boolean | null
    prefEmail: boolean | null
    prefPush: boolean | null
    prefInApp: boolean | null
    initialGuestPreferences: { dietary?: string, accessibility?: string } | null
}

export function PersonalDetailsForm({
    initialBio,
    initialLocation,
    initialFavoriteGames,
    initialPlayStyleTags,
    initialShowReputation,
    prefEmail,
    prefPush,
    prefInApp,
    initialGuestPreferences
}: PersonalDetailsFormProps) {
    const [loading, setLoading] = useState(false)

    // Checkbox states
    const [showReputation, setShowReputation] = useState(initialShowReputation ?? true)
    const [emailNotif, setEmailNotif] = useState(prefEmail ?? true)
    const [pushNotif, setPushNotif] = useState(prefPush ?? true)
    const [inAppNotif, setInAppNotif] = useState(prefInApp ?? true)

    // Tag input state (simple comma separated for now)
    const [tags, setTags] = useState(initialPlayStyleTags ? initialPlayStyleTags.join(', ') : '')

    async function onSubmit(formData: FormData) {
        setLoading(true)
        try {
            // Append checkboxes manually since they are controlled
            if (showReputation) formData.set('show_reputation', 'on')
            formData.append('show_reputation_present', 'true')

            if (emailNotif) formData.set('pref_email_notifications', 'on')
            formData.append('pref_email_notifications_present', 'true')

            if (pushNotif) formData.set('pref_push_notifications', 'on')
            formData.append('pref_push_notifications_present', 'true')

            if (inAppNotif) formData.set('pref_in_app_notifications', 'on')
            formData.append('pref_in_app_notifications_present', 'true')

            // Handle tags
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
            formData.set('play_style_tags', JSON.stringify(tagsArray))

            // Handle guest preferences JSON logic if fields are added (omitted for brevity unless requested)

            const result = await updateProfile(formData)
            if (result.success) {
                toast.success("Profil Details aktualisiert")
            } else {
                toast.error("Fehler: " + result.error)
            }
        } catch (e) {
            toast.error("Fehler beim Speichern")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={onSubmit} className="space-y-8">
            <div className="sky-card p-8 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                    Über mich
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        name="bio"
                        defaultValue={initialBio || ''}
                        placeholder="Erzähl etwas über dich..."
                        className="bg-slate-50 border-slate-100 min-h-[100px]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="location">Wohnort / Region</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                id="location"
                                name="location"
                                defaultValue={initialLocation || ''}
                                className="pl-10 bg-slate-50 border-slate-100"
                                placeholder="z.B. Berlin"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">Spielstil-Tags (Kommagetrennt)</Label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="pl-10 bg-slate-50 border-slate-100"
                                placeholder="Strategie, Party, Eurogames..."
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="favorite_games">Lieblingsspiele</Label>
                    <Textarea
                        id="favorite_games"
                        name="favorite_games"
                        defaultValue={initialFavoriteGames || ''}
                        placeholder="Was spielst du am liebsten?"
                        className="bg-slate-50 border-slate-100"
                    />
                </div>
            </div>

            <div className="sky-card p-8 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    Privatsphäre & Einstellungen
                </h3>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                        <Label className="font-bold text-slate-700">Reputation anzeigen</Label>
                        <p className="text-xs text-slate-400">Zeige anderen deine Zuverlässigkeit an.</p>
                    </div>
                    <Switch checked={showReputation} onCheckedChange={setShowReputation} />
                </div>

                <div className="space-y-4">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Benachrichtigungen
                    </Label>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                        <span className="text-sm">E-Mail Benachrichtigungen</span>
                        <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                        <span className="text-sm">Push Benachrichtigungen</span>
                        <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                        <span className="text-sm">In-App Benachrichtigungen</span>
                        <Switch checked={inAppNotif} onCheckedChange={setInAppNotif} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-blue-600 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-200">
                    {loading ? 'Speichert...' : 'Änderungen speichern'}
                </Button>
            </div>
        </form>
    )
}
