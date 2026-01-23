'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Home, Users, Calendar, Settings, Menu, X, Dice5, Sparkles, Box, User, Swords, Bell, LogOut, Trophy, MessageCircle, Shield, Smartphone, Tablet, Monitor, Globe, Store, History as HistoryIcon, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { NotificationBell } from '@/components/layout/notification-bell'
import { logout } from '@/app/login/actions'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/utils/gamification'
import { GodModePopup } from '@/components/admin/god-mode-popup'
import { updateLastSeen } from '@/app/profile/actions'
import { RewardEffects } from '@/components/gamification/reward-effects'
import Cookies from 'js-cookie'

const menuNavigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Nachrichten', href: '/chat', icon: MessageCircle },
    { name: 'Gruppen', href: '/groups', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Marktplatz', href: '/marketplace', icon: Store },
    { name: 'Meine Spiele', href: '/inventory', icon: Box },
    { name: 'Top-Liste', href: '/leaderboard', icon: Trophy },
    { name: 'Karte', href: '/groups/map', icon: Globe },
    { name: 'Ideen', href: '/features', icon: Sparkles },
    { name: 'Jahresrückblick', href: '/wrapped', icon: HistoryIcon },
    { name: 'Profil', href: '/profile', icon: User },
]

const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: Shield },
    { name: 'Meldungen', href: '/admin/reports', icon: AlertTriangle },
]

export function Shell({ children, user, profile }: { children: React.ReactNode, user: SupabaseUser, profile: any }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [godMode, setGodMode] = useState(() => {
        // Initialize from cookie on client side
        return Cookies.get('godMode') !== 'false'
    })
    const supabase = createClient()

    // Check if we are inside the preview iframe
    const isFramed = searchParams.get('framed') === 'true'

    // Presence Heartbeat
    // Presence Heartbeat and Session Check
    useEffect(() => {
        if (user) {
            updateLastSeen() // Initial call
        }

        const interval = setInterval(async () => {
            if (user) {
                updateLastSeen() // Periodic call
            }
            const { data: { user: sessionUser } } = await supabase.auth.getUser()
            if (!sessionUser) {
                // Optionally, log out the user if their session is no longer valid
                // logout() 
            }
        }, 30000) // Every 30 seconds

        return () => clearInterval(interval)
    }, [user, supabase])

    // Base Super Admin check (from DB profile)
    const isRealSuperAdmin = profile?.system_role === 'super_admin'
    // Effective Super Admin for UI (respects God Mode toggles)
    const isSuperAdmin = isRealSuperAdmin && godMode

    // Sync godMode with cookie
    useEffect(() => {
        Cookies.set('godMode', godMode.toString(), { expires: 7 })
        router.refresh()
    }, [godMode, router])

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
    const levelInfo = getLevelInfo(profile?.points || 0)

    // Preview Mode Render
    if (!isFramed && viewMode !== 'desktop') {
        const currentParams = new URLSearchParams(searchParams.toString())
        currentParams.set('framed', 'true')
        const iframeSrc = `${pathname}?${currentParams.toString()}`

        return (
            <div className="min-h-screen bg-slate-900 flex flex-col h-screen overflow-hidden">
                {/* Preview Toolbar */}
                <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between shadow-lg z-50">
                    <div className="flex items-center gap-4">
                        <span className="text-white font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-400" />
                            Device Preview
                        </span>
                        <div className="flex bg-slate-700 rounded-lg p-1 border border-slate-600">
                            <button
                                onClick={() => setViewMode('mobile')}
                                className={cn(
                                    "p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium",
                                    viewMode === 'mobile' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-600"
                                )}
                            >
                                <Smartphone className="w-4 h-4" />
                                Mobile
                            </button>
                            <button
                                onClick={() => setViewMode('tablet')}
                                className={cn(
                                    "p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium",
                                    viewMode === 'tablet' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-600"
                                )}
                            >
                                <Tablet className="w-4 h-4" />
                                Tablet
                            </button>
                            <button
                                onClick={() => setViewMode('desktop')}
                                className="p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-600"
                            >
                                <Monitor className="w-4 h-4" />
                                Desktop
                            </button>
                        </div>
                    </div>
                    <div className="text-slate-400 text-xs">
                        {viewMode === 'mobile' ? 'iPhone SE (375px)' : 'iPad Mini (768px)'}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-slate-900 overflow-auto p-8 flex justify-center items-start">
                    <div
                        className={cn(
                            "bg-white transition-all duration-300 shadow-2xl overflow-hidden border-8 border-slate-800 rounded-[3rem] relative ring-4 ring-slate-700",
                            viewMode === 'mobile' ? "w-[375px] min-h-[667px]" : "w-[768px] min-h-[1024px]"
                        )}
                        style={{ height: 'calc(100vh - 120px)' }}
                    >
                        {/* Device Notch Simulation (Mobile Only) */}
                        {viewMode === 'mobile' && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-xl z-20"></div>
                        )}

                        <iframe
                            src={iframeSrc}
                            className="w-full h-full bg-slate-50"
                            title="Device Preview"
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-background text-slate-800 overflow-x-hidden">
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

            <div className="flex h-[100dvh] lg:h-screen overflow-hidden">
                {/* Sidebar (Desktop & Mobile) */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block bg-white border-r border-blue-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="h-full flex flex-col p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <Link href="/" className="relative flex items-center gap-3 font-extrabold text-2xl text-slate-800 px-2 mb-8 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center overflow-hidden">
                                <img src="/würfel.png" alt="Logo" className="w-8 h-8" />
                            </div>
                            Game Hub
                            {isSuperAdmin && (
                                <span className="absolute -right-3 -top-2 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black border-2 border-white shadow-sm">
                                    GOD
                                </span>
                            )}
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


                        </nav>

                        {/* Admin Section (Only visible if actual super_admin) */}
                        {profile?.system_role === 'super_admin' && (
                            <div className="space-y-4">
                                <div className="px-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">God Modus Sektion</p>

                                        {/* God Mode Toggle */}
                                        <button
                                            onClick={() => setGodMode(!godMode)}
                                            className={cn(
                                                "text-[9px] font-black px-2 py-0.5 rounded-full transition-all border",
                                                godMode
                                                    ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200"
                                                    : "bg-slate-100 text-slate-400 border-slate-200"
                                            )}
                                            title="God Modus umschalten"
                                        >
                                            {godMode ? 'God Modus' : 'Admin Modus'}
                                        </button>
                                    </div>

                                    {/* View Mode Buttons (Moved here) */}
                                    {godMode && !isFramed && (
                                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 mb-4">
                                            <button
                                                onClick={() => setViewMode('mobile')}
                                                className="flex-1 p-2 rounded-md text-slate-400 hover:text-primary hover:bg-white hover:shadow-sm transition-all flex justify-center"
                                                title="Mobile View"
                                            >
                                                <Smartphone className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('tablet')}
                                                className="flex-1 p-2 rounded-md text-slate-400 hover:text-primary hover:bg-white hover:shadow-sm transition-all flex justify-center"
                                                title="Tablet View"
                                            >
                                                <Tablet className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('desktop')}
                                                className="flex-1 p-2 rounded-md bg-white text-primary shadow-sm transition-all flex justify-center border border-slate-100"
                                                title="Desktop View"
                                            >
                                                <Monitor className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Navigation (Hidden if God Mode is OFF) */}
                                {godMode && (
                                    <div className="space-y-1">
                                        <Link
                                            href="/members"
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group font-bold",
                                                pathname === '/members'
                                                    ? "bg-amber-100 text-amber-700 shadow-sm"
                                                    : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                                            )}
                                        >
                                            <Users className={cn("w-5 h-5 transition-colors", pathname === '/members' ? "text-amber-700" : "group-hover:text-amber-600")} />
                                            <span className="flex-1">Mitglieder</span>
                                        </Link>

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
                            </div>
                        )}

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
                <main className="flex-1 overflow-y-auto relative w-full p-4 md:p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                        <RewardEffects
                            points={profile?.points}
                            badges={profile?.badges}
                        />
                        {children}
                    </div>
                </main>

                {/* Global Feedback Button - Floating */}
                <Link
                    href="/features"
                    className="fixed bottom-6 right-6 z-50 bg-white text-primary p-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-110 hover:shadow-lg transition-all duration-300 border border-blue-50 group flex items-center gap-2"
                    title="Feedback geben"
                >
                    <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-sm whitespace-nowrap text-blue-900 pr-0 group-hover:pr-2">
                        Feedback
                    </span>
                </Link>

                <GodModePopup profile={profile} />
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
