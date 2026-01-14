import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarPlus, UserPlus, Dice5, Search } from "lucide-react"

export function QuickActions() {
    return (
        <div className="sky-card p-4 flex items-center justify-around gap-2">
            <Link href="/events/create" title="Event erstellen">
                <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 hover:bg-blue-50 hover:text-blue-600">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 text-blue-600 flex items-center justify-center">
                        <CalendarPlus className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">Event</span>
                </Button>
            </Link>

            <Link href="/inventory" title="Spiel hinzufügen">
                <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 hover:bg-purple-50 hover:text-purple-600">
                    <div className="w-10 h-10 rounded-xl bg-purple-100/50 text-purple-600 flex items-center justify-center">
                        <Dice5 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">Spiel</span>
                </Button>
            </Link>

            <Link href="/groups" title="Gruppe suchen">
                <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 hover:bg-emerald-50 hover:text-emerald-600">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center">
                        <Search className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">Suchen</span>
                </Button>
            </Link>
        </div>
    )
}
