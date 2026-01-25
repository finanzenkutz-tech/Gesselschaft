'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CalendarPlus, Users, Dice5, History } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'

export function QuickActions({ groups }: { groups?: any[] }) {
    const router = useRouter()
    const myGroups = groups || []

    const handleLogClick = () => {
        if (myGroups.length === 1) {
            router.push(`/groups/${myGroups[0].group_id}?log=true`)
        } else if (myGroups.length === 0) {
            router.push('/groups')
        }
        // If > 1, the dropdown trigger handles it
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/events?new=true" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50 shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CalendarPlus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Event planen</span>
                </Button>
            </Link>

            <Link href="/groups/discover" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:border-emerald-400/50 hover:bg-slate-50 shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Gruppe finden</span>
                </Button>
            </Link>

            <Link href="/inventory" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:border-purple-400/50 hover:bg-slate-50 shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Dice5 className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Spiel scannen</span>
                </Button>
            </Link>

            {myGroups.length > 1 ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:border-amber-400/50 hover:bg-slate-50 shadow-sm transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <History className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700">Spiel loggen</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border border-amber-100 shadow-xl">
                        <div className="px-2 py-1.5 text-xs font-black uppercase tracking-widest text-slate-400">Gruppe wählen</div>
                        {myGroups.map((g: any) => (
                            <DropdownMenuItem
                                key={g.group_id}
                                onClick={() => router.push(`/groups/${g.group_id}?log=true`)}
                                className="rounded-xl font-bold p-3 cursor-pointer hover:bg-amber-50 hover:text-amber-600"
                            >
                                {g.groups?.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button
                    variant="outline"
                    onClick={handleLogClick}
                    className="w-full h-auto py-4 flex flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:border-amber-400/50 hover:bg-slate-50 shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <History className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Spiel loggen</span>
                </Button>
            )}
        </div>
    )
}
