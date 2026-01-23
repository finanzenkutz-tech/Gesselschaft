import { createClient } from '@/lib/supabase/server'
import { CreateGroupDialog } from '@/components/groups/create-group-dialog'
import { GroupCard } from '@/components/groups/group-card'
import { Users, Search, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cookies } from 'next/headers'

export default async function GroupsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Check Super Admin AND God Mode status from cookie
    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', user.id).single()
    const cookieStore = await cookies()
    const godModeCookie = cookieStore.get('godMode')
    const isGodModeActive = godModeCookie?.value !== 'false' // Default to true if not set

    const isSuperAdmin = profile?.system_role === 'super_admin' && isGodModeActive

    // Fetch my groups with members
    const { data: myMemberships } = await supabase
        .from('group_members')
        .select(`
            group_id, 
            groups (
                *,
                members:group_members(
                    user_id,
                    role,
                    profile:profiles(full_name, avatar_url, last_seen)
                )
            )
        `)
        .eq('user_id', user.id)

    const myGroups = myMemberships?.map(m => m.groups) || []

    // Fetch all groups (for discover) with members
    const myGroupIds = new Set(myGroups.map((g: any) => g?.id).filter(Boolean))
    const { data: allGroups } = await supabase
        .from('groups')
        .select(`
            *,
            members:group_members(
                user_id,
                role,
                profile:profiles(full_name, avatar_url, last_seen)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

    // Filter out groups user is already in
    const discoverGroups = allGroups?.filter(g => !myGroupIds.has(g.id)) || []

    // Find active members (online in last 10 minutes) across all my groups
    const now = new Date().getTime()
    const activeMembersMap = new Map()

    myGroups.forEach((group: any) => {
        group.members?.forEach((member: any) => {
            const lastSeen = member.profile?.last_seen ? new Date(member.profile.last_seen).getTime() : 0
            if (now - lastSeen < 10 * 60 * 1000 && member.user_id !== user.id) {
                activeMembersMap.set(member.user_id, member.profile)
            }
        })
    })
    const activeMembers = Array.from(activeMembersMap.values())

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Gruppen</h1>
                    <p className="text-slate-500 text-lg mt-1 font-medium">Verwalte deine Spielrunden oder finde neue Mitspieler.</p>
                </div>
                <CreateGroupDialog />
            </header>

            {/* Gerade Aktiv Section */}
            {activeMembers.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Gerade aktiv
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {activeMembers.map((profile: any, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 pl-1 pr-3 py-1 rounded-full shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-primary overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        profile.full_name?.[0]
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{profile.full_name?.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Meine Gruppen Section */}
            <section className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    Meine Gruppen
                </h2>

                {myGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myGroups.map((group: any) => (
                            <GroupCard key={group.id} group={group} isMember={true} isSuperAdmin={isSuperAdmin} />
                        ))}
                    </div>
                ) : (
                    <div className="sky-card p-8 text-center text-slate-500">
                        Du bist noch keinen Gruppen beigetreten.
                    </div>
                )}
            </section>

            {/* Gruppen Suchen Section */}
            <section className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <Search className="w-5 h-5 text-orange-500" />
                    </div>
                    Gruppen entdecken
                </h2>

                {discoverGroups && discoverGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {discoverGroups.map((group: any) => (
                            <GroupCard key={group.id} group={group} isMember={false} isSuperAdmin={isSuperAdmin} />
                        ))}
                    </div>
                ) : (
                    <div className="sky-card p-8 text-center text-slate-500">
                        Keine weiteren Gruppen zum Entdecken.
                    </div>
                )}
            </section>
        </div>
    )
}
