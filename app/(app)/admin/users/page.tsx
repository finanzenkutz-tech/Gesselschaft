import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Mail, Calendar, Shield, User as UserIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

import { cookies } from 'next/headers'
import { AdminUserTable } from '@/components/admin/user-table'
import { CreateUserDialog } from '@/components/admin/create-user-dialog'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const godMode = cookieStore.get('godMode')?.value === 'true'

    if (!user) redirect('/login')

    // Verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    if (profile?.system_role !== 'super_admin' && profile?.system_role !== 'moderator') {
        redirect('/')
    }

    // Fetch all users
    const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        Mitgliederverwaltung
                    </h1>
                    <p className="text-slate-500 text-lg mt-1">Hier siehst du alle registrierten Nutzer der Plattform.</p>
                </div>
                {godMode && <CreateUserDialog />}
            </header>

            <div className="sky-card overflow-hidden p-6">
                <AdminUserTable users={allUsers || []} godMode={godMode} />
            </div>
        </div>
    )
}
