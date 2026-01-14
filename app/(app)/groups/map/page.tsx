import { createClient } from '@/lib/supabase/server'
import { getGroupsWithLocations } from '@/app/groups/challenge-actions'
import { Search, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPageClient } from '@/components/groups/map-page-client'

export default async function GroupsMapPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all public groups with locations
    const groups = await getGroupsWithLocations()

    // Get user's group IDs to distinguish on map
    let myGroupIds: string[] = []
    let myGroups: { id: string; name: string }[] = []

    if (user) {
        const { data: myMemberships } = await supabase
            .from('group_members')
            .select('group_id, groups(id, name), role')
            .eq('user_id', user.id)
            .eq('role', 'admin') // Only admins can challenge

        if (myMemberships) {
            myGroupIds = myMemberships.map(m => m.group_id)
            myGroups = myMemberships.map(m => m.groups as any).filter(Boolean)
        }
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Gruppen-Karte</h1>
                    <p className="text-slate-500 text-lg">Finde Spielgruppen in deiner Nähe.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/groups">
                        <Button variant="outline">Liste</Button>
                    </Link>
                    <Button disabled className="bg-slate-100 text-slate-400">Karte</Button>
                </div>
            </header>

            <MapPageClient
                groups={groups}
                myGroupIds={myGroupIds}
                myGroups={myGroups}
            />
        </div>
    )
}
