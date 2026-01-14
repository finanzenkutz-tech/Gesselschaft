import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Mail, Calendar, Shield, User as UserIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/')
    }

    // Fetch all users
    const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" />
                    Mitgliederverwaltung
                </h1>
                <p className="text-slate-500 text-lg mt-1">Hier siehst du alle registrierten Nutzer der Plattform.</p>
            </header>

            <div className="sky-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nutzer</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rolle</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registriert</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Zuletzt online</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {allUsers?.map((u) => (
                                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold border-2 border-white shadow-sm overflow-hidden">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-700 truncate">{u.full_name || 'Unbekannt'}</p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {u.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-600">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {u.role === 'admin' ? '👑 Admin' : 'Player'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(u.created_at).toLocaleDateString('de-DE')}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {u.last_seen ? (
                                            <span className="text-slate-500 font-medium">
                                                {formatDistanceToNow(new Date(u.last_seen), { addSuffix: true, locale: de })}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 italic">Noch nie</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
