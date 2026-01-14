import { createClient } from '@/lib/supabase/server'
import { CreateGroupDialog } from '@/components/groups/create-group-dialog'
import { GroupCard } from '@/components/groups/group-card'
import { Users, Search, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function GroupsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Check Super Admin
    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', user.id).single()
    const isSuperAdmin = profile?.system_role === 'super_admin'

    // Fetch my groups
    const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id, groups(*)')
        .eq('user_id', user.id)

    const myGroups = myMemberships?.map(m => m.groups) || []


    // Fetch all groups (for discover)
    const myGroupIds = new Set(myGroups.map((g: any) => g?.id).filter(Boolean))
    const { data: allGroups } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    // Filter out groups user is already in
    const discoverGroups = allGroups?.filter(g => !myGroupIds.has(g.id)) || []

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Gruppen</h1>
                    <p className="text-slate-500 text-lg mt-1">Verwalte deine Spielrunden oder finde neue Mitspieler.</p>
                </div>
                <CreateGroupDialog />
            </header>

            {/* Meine Gruppen Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
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
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                    <Search className="w-5 h-5 text-secondary" />
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
