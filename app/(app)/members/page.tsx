import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Shield, Trophy, Medal } from 'lucide-react'
import { getLevelInfo } from '@/lib/utils/gamification'

export default async function MembersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check Super Admin
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.system_role !== 'super_admin') {
        redirect('/')
    }

    // Fetch all profiles ordered by points (Highscore-like)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    Alle Mitglieder
                    <span className="bg-amber-100 text-amber-600 text-xs px-2 py-1 rounded-full font-black uppercase tracking-wider">
                        Super Admin View
                    </span>
                </h1>
                <p className="text-slate-500 text-lg mt-1">Übersicht aller registrierten Spieler, ihre Rollen und Level.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles?.map((profile: any, index: number) => {
                    const levelInfo = getLevelInfo(profile.points || 0)
                    const isSuperAdmin = profile.system_role === 'super_admin'

                    return (
                        <div key={profile.id} className="sky-card p-6 flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                            {/* Rank Badge for Top 3 */}
                            {index < 3 && (
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy className={`w-24 h-24 ${index === 0 ? 'text-amber-500' :
                                            index === 1 ? 'text-slate-400' :
                                                'text-amber-700'
                                        }`} />
                                </div>
                            )}

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 shrink-0">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        profile.full_name?.[0] || '?'
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 leading-tight">
                                        {profile.full_name || 'Unbekannt'}
                                    </h3>
                                    <p className="text-slate-400 text-sm truncate max-w-[150px]">{profile.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                {/* System Role Badge */}
                                {isSuperAdmin ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                                        <Shield className="w-3 h-3" />
                                        Super Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                                        <Users className="w-3 h-3" />
                                        Spieler
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-50">
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
                                {/* Progress Bar */}
                                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-blue-400"
                                        style={{ width: `${levelInfo.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
