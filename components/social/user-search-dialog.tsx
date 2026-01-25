'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { UserPlus, Users } from 'lucide-react'
import { UserSearch } from '@/components/social/user-search'

export function UserSearchDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-slate-50 border-dashed border-2 border-slate-200 text-slate-400 hover:text-primary hover:border-primary rounded-2xl h-12 transition-all font-bold">
                    <UserPlus className="w-4 h-4 mr-2" /> Buddies finden
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Buddies finden
                    </DialogTitle>
                </DialogHeader>
                <UserSearch />
            </DialogContent>
        </Dialog>
    )
}
