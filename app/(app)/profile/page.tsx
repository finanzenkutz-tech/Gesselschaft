import { createClient } from '@/lib/supabase/server'
import { User, Mail, Lock, Camera, Trophy, Star, Award, AlertTriangle, Bell, History as HistoryIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { updateProfile, updateEmail, updatePassword } from './actions'
import { getBuddies, getPendingBuddyRequests } from './buddy-actions'
import { getUserBadges } from '@/app/(app)/gamification/actions'
import { BuddyWidget } from '@/components/profile/buddy-widget'
import { DeleteAccountButton } from '@/components/profile/delete-account-button'
import { PersonalDetailsForm } from '@/components/profile/personal-details-form'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { getMutedUsers } from '@/app/(app)/settings/user-settings-actions'

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { getLevelInfo } from '@/lib/utils/gamification'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const xp = profile?.xp || 0
    const levelInfo = getLevelInfo(xp)

    const buddies = await getBuddies()
    const pendingRequests = await getPendingBuddyRequests()

    const detailedBadges = await getUserBadges(user?.id || '')

    const mutedUsers = await getMutedUsers()

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Mein Profil</h1>
                    <p className="text-slate-500 text-lg mt-1">Dein Status im Hub.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/level">
                        <Button variant="outline" className="gap-2 rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                            <Trophy className="w-4 h-4" />
                            Level Details
                        </Button>
                    </Link>
                    <Link href="/wrapped">
                        <Button variant="outline" className="gap-2 rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20">
                            <HistoryIcon className="w-4 h-4" />
                            2025
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Avatar & Progress Section */}
            <section className="sky-card p-8 bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-5xl font-black overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <form action={async (formData: FormData) => { 'use server'; await updateProfile(formData) }} className="absolute inset-0">
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                <Camera className="w-8 h-8 text-white" />
                                <input type="file" name="avatar" accept="image/*" className="hidden" />
                                <input type="hidden" name="full_name" value={profile?.full_name || ''} />
                            </label>
                            <button type="submit" className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white">
                                <Camera className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                {profile?.full_name || 'Unbenannter Spieler'}
                                {profile?.nickname && <span className="text-slate-400 text-xl font-bold ml-2">({profile.nickname})</span>}
                            </h2>
                            <p className="text-slate-400 font-medium">{user?.email}</p>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl font-black shadow-md shadow-blue-100">
                                <span>Lvl {levelInfo.level}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold border border-amber-100">
                                <Trophy className="w-4 h-4" />
                                <span>{xp} XP</span>
                            </div>
                            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold border border-purple-100">
                                <Award className="w-4 h-4" />
                                <span>{detailedBadges.length} Badges</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Progress Bar */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nächster Rang</p>
                            <p className="font-black text-slate-700">{levelInfo.rank}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-400">
                            <span className="text-primary">{levelInfo.xpToNext} XP</span> bis Level {levelInfo.level + 1}
                        </p>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            style={{ width: `${levelInfo.progress}%` }}
                        />
                    </div>
                </div>

                {/* Recent Badges Row */}
                {detailedBadges.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-500" />
                                Letzte Auszeichnungen
                            </h3>
                            <Link href="/level" className="text-xs font-bold text-primary hover:underline">Alle ansehen</Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {detailedBadges.slice(0, 6).map((badge: any) => (
                                <TooltipProvider key={badge.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-help">
                                                {badge.badge_definitions?.icon || '🏅'}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-bold">{badge.badge_definitions?.name}</p>
                                            <p className="text-xs">{badge.badge_definitions?.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Personal Details */}
            <PersonalDetailsForm
                initialBio={profile?.bio}
                initialLocation={profile?.location}
                initialFavoriteGames={profile?.favorite_games}
                initialPlayStyleTags={profile?.play_style_tags}
                initialShowReputation={profile?.show_reputation}
                prefEmail={profile?.pref_email_notifications}
                prefPush={profile?.pref_push_notifications}
                prefInApp={profile?.pref_in_app_notifications}
                initialGuestPreferences={profile?.guest_preferences as any}
            />

            {/* Buddy Management */}
            <BuddyWidget
                buddies={buddies}
                pendingRequests={pendingRequests}
                currentUserId={user?.id || ''}
            />

            {/* Edit Name */}
            <section className="sky-card p-8 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <User className="w-6 h-6 text-primary" />
                    Name ändern
                </h3>
                <form action={async (formData: FormData) => { 'use server'; await updateProfile(formData) }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vollständiger Name</label>
                            <Input
                                name="full_name"
                                defaultValue={profile?.full_name || ''}
                                placeholder="Dein Name"
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spitzname</label>
                            <Input
                                name="nickname"
                                defaultValue={profile?.nickname || ''}
                                placeholder="Dein Nickname"
                                className="rounded-xl bg-slate-50 border-slate-100 h-12"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <Switch id="use_nickname" name="use_nickname" defaultChecked={profile?.use_nickname} />
                        <label htmlFor="use_nickname" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700">
                            Spitznamen öffentlich anzeigen statt dem echten Namen
                        </label>
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-blue-600 text-white rounded-xl h-12 px-6 font-bold">
                        Speichern
                    </Button>
                </form>
            </section>

            {/* Edit Email */}
            <section className="sky-card p-8 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <Mail className="w-6 h-6 text-secondary" />
                    E-Mail ändern
                </h3>
                <form action={async (formData: FormData) => { 'use server'; await updateEmail(formData) }} className="space-y-4">
                    <Input
                        name="email"
                        type="email"
                        defaultValue={user?.email || ''}
                        placeholder="neue@email.de"
                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                    />
                    <p className="text-xs text-slate-400">Du erhältst eine Bestätigungs-E-Mail an die neue Adresse.</p>
                    <Button type="submit" className="bg-secondary hover:bg-sky-600 text-white rounded-xl h-12 px-6 font-bold">
                        E-Mail ändern
                    </Button>
                </form>
            </section>

            {/* Change Password */}
            <section className="sky-card p-8 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <Lock className="w-6 h-6 text-red-500" />
                    Passwort ändern
                </h3>
                <form action={async (formData: FormData) => { 'use server'; await updatePassword(formData) }} className="space-y-4">
                    <Input
                        name="password"
                        type="password"
                        placeholder="Neues Passwort"
                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                    />
                    <Input
                        name="confirm_password"
                        type="password"
                        placeholder="Passwort bestätigen"
                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                    />
                    <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 px-6 font-bold">
                        Passwort ändern
                    </Button>
                </form>
            </section>

            {/* Kommunikation & Privatsphäre */}
            <section className="sky-card p-8 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                    <HistoryIcon className="w-6 h-6 text-primary" strokeWidth={3} />
                    Kommunikation & Stummschaltung
                </h3>
                <p className="text-sm text-slate-500">
                    Verwalte deine Benachrichtigungen und stummgeschaltete Spieler.
                </p>
                <NotificationSettings
                    initialEnabled={profile?.notifications_enabled !== false}
                    mutedUsers={mutedUsers as any}
                />
            </section>

            {/* Danger Zone */}
            <section className="sky-card p-8 space-y-6 border-2 border-red-100">
                <h3 className="font-bold text-xl text-red-500 flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    Gefahrenzone
                </h3>
                <p className="text-sm text-slate-500">
                    Hier kannst du deinen Account unwiderruflich löschen. Alle deine Daten werden entfernt.
                </p>
                <DeleteAccountButton />
            </section>
        </div>
    )
}

