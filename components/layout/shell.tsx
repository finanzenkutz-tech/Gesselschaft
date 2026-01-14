'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, Settings, Menu, X, Dice5, Sparkles, Box, User, Swords, Bell, LogOut, Trophy, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { NotificationBell } from '@/components/layout/notification-bell'
import { logout } from '@/app/login/actions'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/utils/gamification'

const menuNavigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Nachrichten', href: '/chat', icon: MessageCircle },
    { name: 'Gruppen', href: '/groups', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Meine Spiele', href: '/inventory', icon: Box },
    { name: 'Mein Level', href: '/level', icon: Trophy },
    { name: 'Herausforderung', href: '/challenge', icon: Swords },
    { name: 'Ideen', href: '/features', icon: Sparkles },
    { name: 'Profil', href: '/profile', icon: User },
]

const adminNavigation = [
    { name: 'Mitglieder', href: '/admin/users', icon: Settings },
]

export function Shell({ children, user, profile }: { children: React.ReactNode, user: SupabaseUser, profile: any }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const supabase = createClient()

    // Presence Heartbeat
    useEffect(() => {
        if (!user) return

        const updatePresence = async () => {
            await supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', user.id)
        }

        updatePresence()
        const interval = setInterval(updatePresence, 1000 * 60 * 5) // Every 5 minutes

        return () => clearInterval(interval)
    }, [user, supabase])

    const isAdmin = profile?.role === 'admin'

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
    const levelInfo = getLevelInfo(profile?.points || 0)

    return (
        <div className="min-h-screen bg-background text-slate-800">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
                    <img src="/würfel.png" alt="Logo" className="w-7 h-7" />
                    Game Hub
                </Link>
                <div className="flex items-center gap-2">
                    <Link href="/level" className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-blue-600 text-white text-[9px] font-black px-2 py-1.5 rounded-xl shadow-md hover:scale-105 transition-transform">
                        <Trophy className="w-3 h-3" />
                        <span className="flex flex-col leading-none">
                            <span>Lvl {levelInfo.level}</span>
                            <span className="opacity-80 text-[7px]">{levelInfo.rank}</span>
                        </span>
                    </Link>
                    <NotificationBell userId={user.id} />
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X /> : <Menu />}
                    </Button>
                </div>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Sidebar (Desktop & Mobile) */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block bg-white border-r border-blue-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="h-full flex flex-col p-6">
                        <Link href="/" className="flex items-center gap-3 font-extrabold text-2xl text-slate-800 px-2 mb-8 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center overflow-hidden">
                                <img src="/würfel.png" alt="Logo" className="w-8 h-8" />
                            </div>
                            Game Hub
                        </Link>

                        <nav className="flex-1 space-y-6">
                            <div className="space-y-1">
                                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Menü</p>
                                {menuNavigation.map((item) => {
                                    const isActive = pathname === item.href
                                    const isLevelItem = item.href === '/level'
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group font-bold",
                                                isActive
                                                    ? "bg-primary text-white shadow-lg shadow-blue-200"
                                                    : "text-slate-500 hover:bg-blue-50 hover:text-primary"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "group-hover:text-primary")} />
                                            <span className="flex-1">{item.name}</span>
                                            {isLevelItem && (
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-lg",
                                                    isActive
                                                        ? "bg-white/20 text-white"
                                                        : "bg-amber-100 text-amber-600"
                                                )}>
                                                    {levelInfo.rank}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>


                            {isAdmin && (
                                <div className="space-y-1">
                                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admin-Bereich</p>
                                    {adminNavigation.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group font-bold",
                                                    isActive
                                                        ? "bg-slate-800 text-white shadow-lg"
                                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                )}
                                            >
                                                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "group-hover:text-slate-800")} />
                                                {item.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </nav>

                        <div className="mb-4 flex justify-end px-2">
                            <NotificationBell userId={user.id} />
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="p-4 bg-blue-50 rounded-2xl space-y-3 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center font-bold text-lg border-2 border-primary/10 shadow-sm shrink-0">
                                        {displayName[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-[10px] font-black uppercase tracking-wider", levelInfo.color)}>{levelInfo.rank}</p>
                                        <p className="text-sm font-bold truncate text-slate-700" title={user.email}>{displayName}</p>
                                    </div>
                                    <Link href="/level" className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                        Lvl {levelInfo.level}
                                    </Link>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                        <span>Fortschritt</span>
                                        <span>{Math.round(levelInfo.progress)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-blue-100">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${levelInfo.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => logout()}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold transition-all text-sm"
                            >
                                <LogOut className="w-5 h-5" />
                                Abmelden
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative w-full p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
