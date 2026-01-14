import { createClient } from '@/lib/supabase/server'
import { User, Mail, Lock, Camera, Trophy, Star, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateProfile, updateEmail, updatePassword } from '@/app/profile/actions'
import { getBuddies, getPendingBuddyRequests } from '@/app/profile/buddy-actions'
import { BuddyWidget } from '@/components/profile/buddy-widget'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const badges = profile?.badges || []
    const points = profile?.points || 0

    const buddies = await getBuddies()
    const pendingRequests = await getPendingBuddyRequests()

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800">Mein Profil</h1>
                <p className="text-slate-500 text-lg mt-1">Bearbeite deine persönlichen Informationen.</p>
            </header>

            {/* Avatar & Points Section */}
            <section className="sky-card p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden border-4 border-white shadow-xl">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <form action={async (formData: FormData) => { 'use server'; await updateProfile(formData) }} className="absolute inset-0">
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
                                <Camera className="w-8 h-8 text-white" />
                                <input type="file" name="avatar" accept="image/*" className="hidden" />
                                <input type="hidden" name="full_name" value={profile?.full_name || ''} />
                            </label>
                            <button type="submit" className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-slate-800">{profile?.full_name || 'Unbenannt'}</h2>
                        <p className="text-slate-500">{user?.email}</p>

                        <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-xl font-bold">
                                <Trophy className="w-5 h-5" />
                                <span>{points} Punkte</span>
                            </div>
                            <div className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-bold">
                                <Star className="w-5 h-5" />
                                <span>{badges.length} Badges</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-500" />
                            Meine Badges
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {badges.map((badge: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>

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
                    <Input
                        name="full_name"
                        defaultValue={profile?.full_name || ''}
                        placeholder="Dein Name"
                        className="rounded-xl bg-slate-50 border-slate-100 h-12"
                    />
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
        </div>
    )
}
