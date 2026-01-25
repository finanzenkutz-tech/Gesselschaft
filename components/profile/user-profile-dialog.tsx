'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getPublicProfile } from '@/app/profile/actions'
import { getOrCreateDirectChat } from '@/app/chat/direct-actions'
import { useRouter } from 'next/navigation'
import { MessageCircle, Trophy, MapPin, User as UserIcon, Dice5 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface UserProfileDialogProps {
    userId: string
    currentUserId?: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function UserProfileDialog({ userId, currentUserId, trigger, open: controlledOpen, onOpenChange }: UserProfileDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (val: boolean) => {
        if (onOpenChange) onOpenChange(val)
        if (!isControlled) setInternalOpen(val)
    }

    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const [startingChat, setStartingChat] = useState(false)

    useEffect(() => {
        if (open && !profile && userId) {
            setLoading(true)
            getPublicProfile(userId).then(p => {
                setProfile(p)
                setLoading(false)
            })
        }
    }, [open, userId, profile])

    const handleStartChat = async () => {
        if (!currentUserId) return
        setStartingChat(true)
        const res = await getOrCreateDirectChat(userId)
        if (res.success && res.chatId) {
            // Navigate to chat with DM selected
            // ChatInterface likely needs to support query param or we create a specific route /chat/dm/[id]
            // For now, let's assume we use query param logic in /chat page or simply push to new route if we build it.
            // Let's try /chat?dm=ID
            router.push(`/chat?dm=${res.chatId}`)
            setOpen(false)
        } else {
            alert(res.error || 'Fehler beim Starten')
        }
        setStartingChat(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && (
                <DialogTrigger asChild onClick={() => setOpen(true)}>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : profile ? (
                    <>
                        {/* Header Image / Color */}
                        <div className="h-32 bg-gradient-to-br from-primary to-blue-600 relative">
                            <div className="absolute -bottom-12 left-8">
                                <div className="p-1 bg-white rounded-[2rem] shadow-xl inline-block">
                                    <Avatar className="w-24 h-24 rounded-[1.8rem] border-4 border-white">
                                        <AvatarImage src={profile.avatar_url} className="object-cover" />
                                        <AvatarFallback className="text-3xl font-black bg-slate-100 text-slate-300">
                                            {profile.full_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </div>

                        <div className="pt-16 pb-8 px-8 space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">{profile.full_name}</h2>
                                {profile.location && (
                                    <div className="flex items-center gap-1 text-slate-500 text-sm font-medium mt-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {profile.location}
                                    </div>
                                )}
                            </div>

                            {/* Stats / Level */}
                            <div className="flex gap-3">
                                <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100 flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5" />
                                    {profile.xp || 0} XP
                                </div>
                                <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-100 flex items-center gap-1.5">
                                    <UserIcon className="w-3.5 h-3.5" />
                                    Mitglied
                                </div>
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100/50 italic">
                                    "{profile.bio}"
                                </div>
                            )}

                            {/* Fav Games */}
                            {profile.favorite_games && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <Dice5 className="w-3 h-3" /> Favoriten
                                    </h3>
                                    <p className="text-sm font-medium text-slate-700">{profile.favorite_games}</p>
                                </div>
                            )}

                            {/* Tags */}
                            {profile.play_style_tags && (
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.isArray(profile.play_style_tags) && profile.play_style_tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {currentUserId && currentUserId !== profile.id && (
                                <div className="pt-4 flex gap-3">
                                    <Button
                                        onClick={handleStartChat}
                                        disabled={startingChat}
                                        className="flex-1 bg-primary hover:bg-blue-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200"
                                    >
                                        {startingChat ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Nachricht
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        Profil nicht gefunden.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
