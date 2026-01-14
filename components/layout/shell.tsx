'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, Settings, Menu, X, Dice5, Sparkles, Box, User, Swords, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { NotificationBell } from '@/components/layout/notification-bell'

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Gruppen', href: '/groups', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Meine Spiele', href: '/inventory', icon: Box },
    { name: 'Herausforderung', href: '/challenge', icon: Swords },
    { name: 'Ideen', href: '/features', icon: Sparkles },
    { name: 'Profil', href: '/profile', icon: User },
]

export function Shell({ children, user, profile }: { children: React.ReactNode, user: SupabaseUser, profile: any }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

    return (
        <div className="min-h-screen bg-background text-slate-800">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <img src="/würfel.png" alt="Logo" className="w-7 h-7" />
                    Game Hub
                </div>
                <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-3 font-extrabold text-2xl text-slate-800 px-2 mb-8">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center overflow-hidden">
                                <img src="/würfel.png" alt="Logo" className="w-8 h-8" />
                            </div>
                            Game Hub
                        </div>

                        <nav className="flex-1 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
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
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="mb-4 flex justify-end px-2">
                            <NotificationBell userId={user.id} />
                        </div>

                        <div className="mt-auto p-4 bg-blue-50 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center font-bold text-lg border-2 border-primary/10">
                                {displayName[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Player</p>
                                <p className="text-sm font-bold truncate text-slate-700" title={user.email}>{displayName}</p>
                            </div>
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
