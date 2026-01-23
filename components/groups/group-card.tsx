'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { deleteGroup } from '@/app/groups/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GroupCardProps {
    group: any
    isMember?: boolean
    isSuperAdmin?: boolean
}

export function GroupCard({ group, isMember, isSuperAdmin }: GroupCardProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation()

        setIsDeleting(true)
        const result = await deleteGroup(group.id)
        if (result.success) {
            toast.success('Gruppe gelöscht')
            router.refresh()
        } else {
            toast.error(result.error || 'Fehler beim Löschen')
        }
        setIsDeleting(false)
    }

    return (
        <div className="relative group block h-full">
            <Link href={`/groups/${group.id}`} className="block h-full">
                <div className={`sky-card p-6 h-full flex flex-col justify-between hover:border-primary/20 hover:shadow-xl transition-all ${!isMember ? 'border-dashed border-2 border-slate-100 bg-slate-50/50 hover:border-secondary/20 hover:text-secondary' : ''}`}>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-bold text-xl text-slate-800 ${isMember ? 'group-hover:text-primary' : 'group-hover:text-secondary'} transition-colors`}>{group.name}</h3>
                            {group.members?.length > 0 && (
                                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                    {group.members.length} {group.members.length === 1 ? 'Mitglied' : 'Mitglieder'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{group.description || 'Keine Beschreibung'}</p>

                        {/* Member Avatars */}
                        {group.members?.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden py-1">
                                {group.members.slice(0, 5).map((m: any, i: number) => (
                                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase overflow-hidden" title={m.profile?.full_name}>
                                        {m.profile?.avatar_url ? (
                                            <img src={m.profile.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            m.profile?.full_name?.[0] || '?'
                                        )}
                                    </div>
                                ))}
                                {group.members.length > 5 && (
                                    <div className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        +{group.members.length - 5}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Footer / Status Badge */}
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                {isMember ? (
                    <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-sm text-green-500 font-bold">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Aktiv dabei
                    </div>
                ) : (
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-sm text-secondary font-bold">
                        Beitreten <ArrowRight className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Delete Button (Super Admin) */}
            {isSuperAdmin && (
                <div className="absolute top-4 right-4 z-10">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full shadow-md border border-slate-100 transition-all hover:scale-110 active:scale-95"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                }}
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Gruppe wirklich löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Diese Aktion kann nicht rückgängig gemacht werden. Dies wird die Gruppe "{group.name}" permanent löschen.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e: React.MouseEvent) => e.stopPropagation()}>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                    Löschen
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    )
}
