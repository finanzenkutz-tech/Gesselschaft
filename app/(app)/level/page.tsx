'use client'

import { Trophy, Star, Target, Zap, Award, ChevronRight, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { getLevelInfo, LevelInfo } from '@/lib/utils/gamification'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BadgeGrid } from '@/components/gamification/badge-display'

export default function LevelPage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    if (loading) return null

    const levelInfo = getLevelInfo(profile?.points || 0)

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Hero Section */}
            <header className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <span className="text-5xl md:text-6xl font-black">{levelInfo.level}</span>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                                <Trophy className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-left space-y-2 flex-1">
                        <p className={cn("text-xs font-black uppercase tracking-[0.3em] opacity-80", levelInfo.color)}>Dein Aktueller Rang</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{levelInfo.rank}</h1>
                        <p className="text-blue-100/80 font-medium max-w-md">
                            Du hast bereits {profile?.points || 0} Punkte gesammelt. Nur noch {levelInfo.xpToNext} XP bis Level {levelInfo.level + 1}!
                        </p>
                    </div>
                </div>

                <div className="mt-12 space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-blue-100">
                        <span>XP Fortschritt</span>
                        <span>{Math.round(levelInfo.progress)}%</span>
                    </div>
                    <div className="h-4 w-full bg-white/10 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 p-1">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${levelInfo.progress}%` }}
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="sky-card p-6 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Punkte</p>
                        <p className="text-3xl font-black text-slate-800">{profile?.points || 0}</p>
                    </div>
                </div>

                <div className="sky-card p-6 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Badges</p>
                        <p className="text-3xl font-black text-slate-800">{profile?.badges?.length || 0}</p>
                    </div>
                </div>

                <div className="sky-card p-6 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-sm">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Nächstes Level</p>
                        <p className="text-3xl font-black text-slate-800">{levelInfo.level + 1}</p>
                    </div>
                </div>
            </div>

            {/* How to earn points */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2">
                    <Star className="w-7 h-7 text-yellow-500" />
                    Wie sammle ich Punkte?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Events besuchen', xp: '+50 XP', desc: 'Nimm an einem Spieleabend teil.' },
                        { title: 'Spiele mitbringen', xp: '+20 XP', desc: 'Trage dich in der Mitbringliste ein.' },
                        { title: 'Challenges gewinnen', xp: '+30 XP', desc: 'Bezüge einen Buddy in einem Spiel.' },
                        { title: 'Neue Spiele einfügen', xp: '+10 XP', desc: 'Erweitere die Gruppen-Kollektion.' },
                    ].map((item, i) => (
                        <div key={i} className="sky-card p-5 flex items-center justify-between group hover:border-primary/30 transition-all cursor-default">
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-800">{item.title}</h3>
                                <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                            </div>
                            <div className="bg-primary/5 text-primary text-sm font-black px-3 py-1.5 rounded-xl border border-primary/10">
                                {item.xp}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Level Roadmap */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2">
                    <Award className="w-7 h-7 text-primary" />
                    Deine Reise
                </h2>
                <div className="sky-card p-0 overflow-hidden">
                    <div className="p-8 space-y-8">
                        {[
                            { level: 1, name: 'Tisch-Gast', active: levelInfo.level >= 1 },
                            { level: 5, name: 'Würfel-Lehrling', active: levelInfo.level >= 5 },
                            { level: 10, name: 'Brett-Kenner', active: levelInfo.level >= 10 },
                            { level: 20, name: 'Strategie-Meister', active: levelInfo.level >= 20 },
                            { level: 50, name: 'Spiele-Legende', active: levelInfo.level >= 50 },
                        ].map((milestone, i) => (
                            <div key={i} className={cn(
                                "flex items-center gap-6 relative",
                                i !== 4 && "after:content-[''] after:absolute after:left-7 after:top-14 after:w-0.5 after:h-10 after:bg-slate-100"
                            )}>
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 transition-all shadow-sm",
                                    milestone.active ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-300 border-slate-100"
                                )}>
                                    Lvl {milestone.level}
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn("font-black text-lg", milestone.active ? "text-slate-800" : "text-slate-300")}>
                                        {milestone.name}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-400">
                                        {milestone.active ? 'Freigeschaltet ✨' : 'Gesperrt'}
                                    </p>
                                </div>
                                {milestone.active && <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center border border-green-100"><Award className="w-4 h-4" /></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Badges Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2">
                    <Award className="w-7 h-7 text-amber-500" />
                    Deine Abzeichen
                </h2>
                <BadgeGrid earnedBadges={profile?.badges || []} />
            </section>

            <footer className="text-center pb-12">
                <Link href="/">
                    <Button variant="ghost" className="text-slate-400 hover:text-primary font-bold">
                        Zurück zum Dashboard
                    </Button>
                </Link>
            </footer>
        </div>
    )
}
