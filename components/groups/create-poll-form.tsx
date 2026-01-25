'use client'

import { useState } from 'react'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { createPoll } from '@/app/(app)/groups/poll-actions'
import { useRouter } from 'next/navigation'

interface CreatePollFormProps {
    groupId: string
}

export function CreatePollForm({ groupId }: CreatePollFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [dateOptions, setDateOptions] = useState<string[]>([''])
    const router = useRouter()

    const addDateOption = () => {
        setDateOptions([...dateOptions, ''])
    }

    const removeDateOption = (index: number) => {
        setDateOptions(dateOptions.filter((_, i) => i !== index))
    }

    const updateDateOption = (index: number, value: string) => {
        const updated = [...dateOptions]
        updated[index] = value
        setDateOptions(updated)
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)

        // Add all date options to formData
        dateOptions.filter(d => d).forEach(date => {
            formData.append('date_options', date)
        })
        formData.set('group_id', groupId)

        const result = await createPoll(formData)
        setLoading(false)

        if (result.success) {
            setOpen(false)
            setDateOptions([''])
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                    <Calendar className="w-4 h-4 mr-2" />
                    Termin-Umfrage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
                    <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Neue Termin-Umfrage
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-1">
                        Lass die Gruppe über den besten Termin abstimmen.
                    </DialogDescription>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Titel *</label>
                        <Input
                            name="title"
                            placeholder="z.B. Nächster Spieleabend"
                            required
                            className="rounded-xl h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Beschreibung</label>
                        <Input
                            name="description"
                            placeholder="Optional: weitere Infos..."
                            className="rounded-xl h-12"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Termin-Optionen *</label>
                        {dateOptions.map((date, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => updateDateOption(index, e.target.value)}
                                    className="rounded-xl h-12 flex-1"
                                    required
                                />
                                {dateOptions.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeDateOption(index)}
                                        className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addDateOption}
                            className="w-full rounded-xl h-10 border-dashed"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Weitere Option hinzufügen
                        </Button>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg"
                    >
                        {loading ? 'Wird erstellt...' : 'Umfrage erstellen'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

