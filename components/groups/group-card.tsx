'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { deleteGroup } from '@/app/groups/actions'
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
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation()

        setIsDeleting(true)
        const result = await deleteGroup(group.id)
        if (result.success) {
            toast.success('Gruppe gelöscht')
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
                        <h3 className={`font-bold text-xl mb-2 text-slate-800 ${isMember ? 'group-hover:text-primary' : 'group-hover:text-secondary'} transition-colors`}>{group.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{group.description || 'Keine Beschreibung'}</p>
                    </div>
                </div>
            </Link>

            {/* Footer / Status Badge */}
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                {isMember ? (
                    <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-sm text-green-500 font-bold">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Mitglied
                    </div>
                ) : (
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-sm text-secondary font-bold">
                        Ansehen <ArrowRight className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Delete Button (Super Admin) */}
            {isSuperAdmin && (
                <div className="absolute top-4 right-4 z-10">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="p-2 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-100 transition-colors"
                                onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
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
