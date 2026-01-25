import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Shield } from 'lucide-react'
import { MemberCard } from '@/components/admin/member-card'
import { CreateMemberDialog } from '@/components/admin/create-member-dialog'

export default async function MembersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check Super Admin
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .maybeSingle()

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
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        Alle Mitglieder
                        <span className="bg-amber-100 text-amber-600 text-xs px-2 py-1 rounded-full font-black uppercase tracking-wider">
                            God Modus Ansicht
                        </span>
                    </h1>
                    <p className="text-slate-500 text-lg mt-1">
                        Übersicht aller registrierten Spieler. Hover über eine Karte für Aktionen.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <CreateMemberDialog />
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-xl h-12">
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span className="font-bold">{profiles?.length || 0}</span> Nutzer
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles?.map((profile: any, index: number) => (
                    <MemberCard
                        key={profile.id}
                        profile={profile}
                        index={index}
                        currentUserId={user.id}
                    />
                ))}
            </div>
        </div>
    )
}
