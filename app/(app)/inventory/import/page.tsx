import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CSVImportClient } from '@/components/inventory/csv-import-client'
import { ArrowLeft, Database, Layers } from 'lucide-react'
import Link from 'next/link'

export default async function CSVImportPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: groups } = await supabase
        .from('group_members')
        .select('groups(id, name)')
        .eq('user_id', user.id)

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/inventory" className="inline-flex items-center text-slate-500 hover:text-primary font-bold gap-2 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Zurück zur Sammlung
            </Link>

            <div className="sky-card overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 text-white relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Massenupload (CSV)</h1>
                        </div>
                        <p className="text-slate-300 max-w-xl font-medium">
                            Importiere deine gesamte Spielesammlung in Sekunden. Bestens geeignet für große Datenbanken (z.B. Export von BGG oder Excel).
                        </p>
                    </div>
                    <Database className="w-64 h-64 opacity-5 absolute -bottom-10 -right-10 pointer-events-none" />
                </div>

                <div className="p-8 md:p-12">
                    <CSVImportClient groups={groups || []} />
                </div>
            </div>

            <div className="sky-card p-8 bg-blue-50/50 border-dashed border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">Wie funktioniert&apos;s?</h3>
                <ul className="text-sm text-blue-700 space-y-2 list-disc ml-5 font-medium">
                    <li>Erstelle eine CSV-Datei mit den Spalten: <strong>Name, BGG_ID (optional)</strong></li>
                    <li>Oder nutze einen Export von BoardGameGeek.</li>
                    <li>Zusätzliche Infos wie Kategorie oder Komplexität werden automatisch von BGG nachgeladen, falls eine ID vorhanden ist.</li>
                </ul>
            </div>
        </div>
    )
}
