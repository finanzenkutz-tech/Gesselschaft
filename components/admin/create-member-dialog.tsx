
'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, UserPlus, Mail, Lock, User, Check, Sparkles } from 'lucide-react'
import { createMember } from '@/app/(app)/members/actions'
import { toast } from 'sonner'

export function CreateMemberDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        isTeacher: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createMember(formData)

            if (result.success) {
                toast.success('Mitglied erfolgreich erstellt!', {
                    description: result.password ? `Passwort: ${result.password}` : undefined,
                    duration: 10000
                })
                setOpen(false)
                setFormData({ email: '', fullName: '', password: '', isTeacher: false })
            } else {
                toast.error('Fehler beim Erstellen', {
                    description: result.error
                })
            }
        } catch (error) {
            toast.error('Ein unerwarteter Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95 group">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                    Mitglied erstellen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
                    <Sparkles className="w-12 h-12 text-white/30 absolute -right-2 -top-2 rotate-12" />
                    <UserPlus className="w-8 h-8 text-white absolute left-8 top-1/2 -translate-y-1/2" />
                    <div className="text-center z-10">
                        <h2 className="text-2xl font-black text-white tracking-tight">Neues Mitglied</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Vollständiger Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    required
                                    placeholder="Max Mustermann"
                                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email Adresse</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    required
                                    type="email"
                                    placeholder="max@beispiel.de"
                                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 flex justify-between">
                                Passwort
                                <span className="text-xs font-normal text-slate-400">Optional (wird sonst generiert)</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Automatisch generieren..."
                                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono text-sm"
                                    value={formData.password}
                                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <input
                                type="checkbox"
                                id="isTeacher"
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={formData.isTeacher}
                                onChange={(e) => setFormData(p => ({ ...p, isTeacher: e.target.checked }))}
                            />
                            <label htmlFor="isTeacher" className="text-sm font-bold text-slate-700 cursor-pointer">
                                Als Lehrer markieren
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-xl transition-all active:scale-95"
                        >
                            {loading ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Mitglied jetzt anlegen <Check className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
