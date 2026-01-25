'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Plus, Trash2, Target, Calendar, CheckCircle2, Circle } from 'lucide-react'
import { createGroupGoal, updateGoalProgress, deleteGoal } from '@/app/(app)/groups/goal-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface GroupGoalsProps {
    groupId: string
    goals: any[]
    isAdmin?: boolean
}

export function GroupGoals({ groupId, goals, isAdmin }: GroupGoalsProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [targetValue, setTargetValue] = useState(10)
    const [unit, setUnit] = useState('sessions')
    const [loading, setLoading] = useState(false)

    const handleCreate = async () => {
        if (!title.trim()) return
        setLoading(true)
        try {
            await createGroupGoal(groupId, {
                title,
                targetValue,
                unit
            })
            setTitle('')
            setOpen(false)
            toast.success('Gruppenziel erstellt!')
        } catch (e) {
            toast.error('Fehler beim Erstellen')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (goalId: string, current: number, target: number) => {
        const newValue = prompt('Neuer Fortschritt?', current.toString())
        if (newValue === null) return
        const val = parseInt(newValue)
        if (isNaN(val)) return

        try {
            await updateGoalProgress(goalId, val, groupId)
            toast.success('Fortschritt aktualisiert')
        } catch (e) {
            toast.error('Fehler')
        }
    }

    const handleDelete = async (goalId: string) => {
        if (!confirm('Ziel löschen?')) return
        try {
            await deleteGoal(goalId, groupId)
            toast.success('Ziel entfernt')
        } catch (e) {
            toast.error('Fehler')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Target className="w-6 h-6 text-emerald-500" />
                    Saisonale Gruppenziele
                </h2>
                {isAdmin && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="rounded-xl">
                                <Plus className="w-4 h-4 mr-2" /> Neues Ziel
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Gruppenziel festlegen</DialogTitle>
                                <DialogDescription>Was wollt ihr als Gruppe erreichen?</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Titel des Ziels</Label>
                                    <Input
                                        placeholder="z.B. Winter-Marathon"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Zielwert</Label>
                                        <Input
                                            type="number"
                                            value={targetValue}
                                            onChange={(e) => setTargetValue(parseInt(e.target.value))}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Einheit</Label>
                                        <select
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            title="Zieleinheit auswählen"
                                        >
                                            <option value="sessions">Spielrunden</option>
                                            <option value="hours">Stunden</option>
                                            <option value="games">Verschiedene Spiele</option>
                                            <option value="players">Neue Mitspieler</option>
                                        </select>
                                    </div>
                                </div>
                                <Button className="w-full h-12 rounded-xl text-lg font-black mt-4" onClick={handleCreate} disabled={loading}>
                                    Ziel aktivieren
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {goals.length === 0 ? (
                <div className="sky-card p-12 text-center text-slate-400 border-dashed border-2 bg-slate-50/30">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-10" />
                    <p className="font-bold text-slate-500">Aktuell keine aktiven Ziele. Zeit für eine neue Staffel?</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) => {
                        const progress = Math.min(100, (goal.current_value / goal.target_value) * 100)
                        const isCompleted = progress >= 100
                        return (
                            <div key={goal.id} className={cn(
                                "sky-card p-6 space-y-4 relative overflow-hidden transition-all group",
                                isCompleted ? "bg-emerald-50/30 border-emerald-100" : "bg-white/50"
                            )}>
                                {isCompleted && (
                                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500 rotate-45 flex items-center justify-center pt-8 pr-8">
                                        <Trophy className="w-6 h-6 text-white -rotate-45" />
                                    </div>
                                )}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                            {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                                            {goal.title}
                                        </h3>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {goal.current_value} / {goal.target_value} {goal.unit === 'sessions' ? 'Runden' : goal.unit === 'hours' ? 'Stunden' : goal.unit === 'games' ? 'Spiele' : 'Gefährten'}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-500" onClick={() => handleUpdate(goal.id, goal.current_value, goal.target_value)}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDelete(goal.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Progress value={progress} className={cn("h-3 rounded-full", isCompleted ? "bg-emerald-100" : "bg-slate-100")} />
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        <span>Start</span>
                                        <span>{Math.round(progress)}% geschafft</span>
                                        <span>Ziel</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

