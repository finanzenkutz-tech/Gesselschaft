'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { updatePassword } from './actions'
import { LayoutGrid, Lock } from 'lucide-react'

function UpdatePasswordForm() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 to-white">
            {/* Decorative Floating Elements */}
            <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-sky-200/40 rounded-full blur-[40px] animate-[float_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-blue-100/50 rounded-full blur-[60px] animate-[float_8s_ease-in-out_infinite_reverse]" />

            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 relative z-10 border border-white/50">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-6 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)] border-2 border-blue-100">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
                        Neues Passwort setzen
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Bitte gib dein neues Passwort ein.
                    </p>
                </div>

                <form className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1" htmlFor="password">
                                Neues Passwort
                            </label>
                            <input
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1" htmlFor="confirmPassword">
                                Passwort bestätigen
                            </label>
                            <input
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        formAction={updatePassword}
                        className="w-full py-4 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Passwort speichern
                    </button>
                </form>
            </div>

            <div className="absolute bottom-6 text-center text-sm text-slate-400 font-medium">
                Ultimate Board Game Hub © 2026
            </div>
        </div>
    )
}

export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <UpdatePasswordForm />
        </Suspense>
    )
}
