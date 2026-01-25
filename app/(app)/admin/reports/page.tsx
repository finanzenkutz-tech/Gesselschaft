import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Check, X, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { updateReportStatus } from '@/app/(app)/admin/actions'
import { deleteListing } from '@/app/(app)/marketplace/actions'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
    const supabase = await createClient()

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', user.id).single()
    if (profile?.system_role !== 'super_admin') redirect('/')

    const { data: reports } = await supabase
        .from('marketplace_reports')
        .select('*, marketplace_listings(id, title, status), reporter:profiles!reporter_id(full_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Marktplatz Meldungen</h1>
                    <p className="text-slate-500">Prüfe gemeldete Anzeigen und ergreife Maßnahmen.</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                    {reports?.length || 0} Offen
                </Badge>
            </div>

            {!reports || reports.length === 0 ? (
                <Card className="border-dashed border-2 py-12">
                    <CardContent className="flex flex-col items-center justify-center text-slate-400">
                        <Check className="w-12 h-12 mb-4 opacity-20" />
                        <p>Keine offenen Meldungen. Alles sauber!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {reports.map((report) => (
                        <Card key={report.id} className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    <CardTitle className="text-lg">
                                        Meldung für: {report.marketplace_listings?.title || 'Gelöschte Anzeige'}
                                    </CardTitle>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {new Date(report.created_at).toLocaleString('de-DE')}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Grund</p>
                                            <p className="font-bold text-slate-800">{report.reason}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Beschreibung</p>
                                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{report.description || 'Keine weitere Beschreibung.'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gemeldet von</p>
                                            <p className="text-slate-800 text-sm">{report.reporter?.full_name || 'Unbekannt'}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 justify-center md:items-end">
                                        {report.marketplace_listings && (
                                            <Button variant="outline" className="w-full md:w-48 gap-2" asChild>
                                                <Link href={`/marketplace/${report.marketplace_listings.id}`} target="_blank">
                                                    <ExternalLink className="w-4 h-4" />
                                                    Anzeige ansehen
                                                </Link>
                                            </Button>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 w-full md:w-48">
                                            <form action={async () => { 'use server'; await updateReportStatus(report.id, 'dismissed') }}>
                                                <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-2">
                                                    <X className="w-4 h-4" />
                                                    Ablehnen
                                                </Button>
                                            </form>
                                            <form action={async () => { 'use server'; await updateReportStatus(report.id, 'resolved') }}>
                                                <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50 gap-2">
                                                    <Check className="w-4 h-4" />
                                                    Gelöst
                                                </Button>
                                            </form>
                                        </div>

                                        {report.marketplace_listings && (
                                            <form
                                                className="w-full md:w-48"
                                                action={async () => {
                                                    'use server';
                                                    await deleteListing(report.listing_id);
                                                    await updateReportStatus(report.id, 'resolved');
                                                }}
                                            >
                                                <Button variant="destructive" className="w-full gap-2">
                                                    <Trash2 className="w-4 h-4" />
                                                    Anzeige löschen
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

