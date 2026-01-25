'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, Box, User, Trophy, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Gruppen', href: '/groups', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Profil', href: '/profile', icon: User },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
            {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all duration-300",
                            isActive
                                ? "text-primary scale-110"
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-all duration-300 relative",
                            isActive && "bg-blue-50 text-primary shadow-sm ring-1 ring-blue-100"
                        )}>
                            <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            {isActive && (
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            )}
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-tighter transition-all duration-300",
                            isActive ? "opacity-100" : "opacity-0 h-0 scale-50"
                        )}>
                            {item.name}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
