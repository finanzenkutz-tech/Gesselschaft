import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, Users, LayoutGrid, Calendar, Trash2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllUsers, getAllGroups, deleteAnyGroup } from './actions'
import { AdminUserTable } from '@/components/admin/user-table'
import Link from 'next/link'

export default async function AdminDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    if (profile?.system_role !== 'super_admin') {
        redirect('/')
    }

    const users = await getAllUsers()
    const groups = await getAllGroups()
    const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-amber-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 text-lg mt-1">Systemweite Verwaltung von BoardGameHub.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="sky-card p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Benutzer</p>
                            <h3 className="text-2xl font-black text-slate-800">{users.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="sky-card p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gruppen</p>
                            <h3 className="text-2xl font-black text-slate-800">{groups.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="sky-card p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Events</p>
                            <h3 className="text-2xl font-black text-slate-800">{eventCount || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <section className="space-y-6">
                <div className="sky-card p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Benutzerverwaltung
                        </h2>
                    </div>
                    <AdminUserTable users={users} />
                </div>

                <div className="sky-card p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-secondary" />
                            Gruppenverwaltung
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="py-4 px-6 font-bold">Gruppe</th>
                                    <th className="py-4 px-6 font-bold">Erstellt von</th>
                                    <th className="py-4 px-6 font-bold text-right">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {groups.map((group) => (
                                    <tr key={group.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-slate-700">{group.name}</p>
                                            <p className="text-xs text-slate-400 truncate max-w-xs">{group.description || 'Keine Beschreibung'}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-medium text-slate-600">{group.profiles?.full_name || 'Unbekannt'}</p>
                                            <p className="text-xs text-slate-400">{group.profiles?.email}</p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/groups/${group.id}`}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <form action={async () => {
                                                    'use server'
                                                    await deleteAnyGroup(group.id)
                                                }}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    )
}
