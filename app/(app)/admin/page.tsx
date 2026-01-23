import { getAdminStats, getAllUsers, getAllGroups } from '@/app/(app)/admin/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, ShoppingBag, ShieldAlert, Layers, ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

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
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse" />
                <h1 className="text-3xl font-black text-slate-800">Zugriff verweigert</h1>
                <p className="text-slate-500 max-w-md">Diese Seite ist nur für Super-Admins zugänglich. Deine Oma hat dich wohl nicht gut genug erzogen?</p>
                <Button asChild>
                    <Link href="/">Zurück zum Dashboard</Link>
                </Button>
            </div>
        )
    }

    const stats = await getAdminStats()
    const allUsers = await getAllUsers()
    const allGroups = await getAllGroups()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Layers className="w-10 h-10 text-primary" />
                        Admin Zentrale
                    </h1>
                    <p className="text-slate-500 text-lg mt-1 font-medium">Behalte den Überblick über dein Imperium.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest h-fit">
                        God Modus
                    </Badge>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="User"
                    value={stats.users}
                    icon={Users}
                    color="bg-blue-500"
                    description="Registrierte Spieler"
                />
                <StatCard
                    title="Gruppen"
                    value={stats.groups}
                    icon={Layers}
                    color="bg-purple-500"
                    description="Aktive Spielerunden"
                />
                <StatCard
                    title="Events"
                    value={stats.events}
                    icon={Calendar}
                    color="bg-green-500"
                    description="Geplante Spieleabende"
                />
                <StatCard
                    title="Marktplatz"
                    value={stats.listings}
                    icon={ShoppingBag}
                    color="bg-orange-500"
                    description="Aktive Anzeigen"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Reports Widget */}
                <Card className="lg:col-span-1 sky-card p-0 border-red-100/50">
                    <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                Offene Meldungen
                            </CardTitle>
                            <CardDescription>Handlungsbedarf am Marktplatz</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="font-bold text-red-600" asChild>
                            <Link href="/admin/reports">Alle ansehen</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {stats.recentReports.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <p className="font-bold">Alles sauber! ✨</p>
                                <p className="text-sm">Keine offenen Meldungen.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {stats.recentReports.map((report: any) => (
                                    <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-slate-800 text-sm">{report.reason}</p>
                                            <Badge variant="outline" className="text-[10px] uppercase font-black">OPEN</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2 truncate">Anzeige: {report.marketplace_listings?.title || 'Gelöscht'}</p>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase tracking-widest text-slate-400" asChild>
                                                <Link href={`/marketplace/${report.listing_id}`}>Ansehen</Link>
                                            </Button>
                                            <Button size="sm" variant="secondary" className="h-7 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100">Löschen</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity / Users Overview */}
                <Card className="lg:col-span-2 sky-card p-0">
                    <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-slate-800">Mitglieder (Overview)</CardTitle>
                            <CardDescription>Die letzten Neuzugänge</CardDescription>
                        </div>
                        <Button variant="ghost" className="font-bold text-primary group" asChild>
                            <Link href="/members">
                                Alle Mitglieder
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Rolle</th>
                                        <th className="px-6 py-3">Points</th>
                                        <th className="px-6 py-3">Beigetreten</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {allUsers.slice(0, 5).map((u: any) => (
                                        <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary border border-slate-200">
                                                        {u.full_name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{u.full_name || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-black uppercase px-2 py-0.5",
                                                    u.system_role === 'super_admin' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    {u.system_role || 'member'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-primary">
                                                {u.points || 0} XP
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-medium">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, description }: any) {
    return (
        <Card className="sky-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-0">
                <div className="p-6 flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</p>
                        <h4 className="text-3xl font-black text-slate-800">{value}</h4>
                    </div>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
                <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {description}
                </div>
            </CardContent>
        </Card>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
