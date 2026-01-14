'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, signup, forgotPassword } from './actions'
import { LayoutGrid, UserPlus, LogIn } from 'lucide-react'
import confetti from 'canvas-confetti'

function LoginForm() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    const [isRegistering, setIsRegistering] = useState(false)
    const [isRecovering, setIsRecovering] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSignup = async (formData: FormData) => {
        setIsLoading(true)

        // Fire confetti on signup attempt! 🎉
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
        })

        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 }
            })
            confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 }
            })
        }, 200)

        // Call the signup action
        await signup(formData)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 to-white">
            {/* Decorative Floating Elements */}
            <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-sky-200/40 rounded-full blur-[40px] animate-[float_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-blue-100/50 rounded-full blur-[60px] animate-[float_8s_ease-in-out_infinite_reverse]" />

            <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-white/50">

                {/* Left Side: Form */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-6 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)] border-2 border-blue-100 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                            <img src="/würfel.png" alt="Dice Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
                            {isRegistering ? 'Account erstellen' : 'Willkommen zurück!'}
                        </h1>
                        <p className="text-slate-500 text-lg">
                            {isRegistering
                                ? 'Erstelle deinen Account und werde Teil der Community.'
                                : 'Logge dich ein, um deinen nächsten Spieleabend zu planen.'}
                        </p>
                    </div>

                    <form className="space-y-5 max-w-sm">

                        {message && (
                            <div className="p-4 rounded-2xl bg-green-50 text-green-600 text-sm font-medium flex items-center gap-2">
                                <span>✅</span> {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Full Name - only shown when registering */}
                            {isRegistering && !isRecovering && (
                                <div className="animate-in slide-in-from-top-4 duration-300">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1" htmlFor="full_name">
                                        Dein Name
                                    </label>
                                    <input
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        placeholder="Max Mustermann"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1" htmlFor="email">
                                    E-Mail Adresse
                                </label>
                                <input
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@beispiel.de"
                                    required
                                />
                            </div>

                            {!isRecovering && (
                                <div>
                                    <div className="flex justify-between items-center mb-2 ml-1">
                                        <label className="block text-sm font-bold text-slate-700" htmlFor="password">
                                            Passwort
                                        </label>
                                        {!isRegistering && (
                                            <button
                                                type="button"
                                                onClick={() => setIsRecovering(true)}
                                                className="text-sm font-medium text-primary hover:text-blue-600 transition-colors"
                                            >
                                                Vergessen?
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required={!isRecovering}
                                        minLength={6}
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            {isRecovering ? (
                                <>
                                    <button
                                        formAction={forgotPassword}
                                        className="w-full py-4 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        Reset Link senden
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecovering(false)}
                                        className="w-full py-4 rounded-2xl bg-transparent hover:bg-slate-50 text-slate-500 font-semibold transition-all"
                                    >
                                        Zurück zum Login
                                    </button>
                                </>
                            ) : isRegistering ? (
                                <>
                                    <button
                                        formAction={handleSignup}
                                        disabled={isLoading}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        {isLoading ? 'Wird erstellt...' : 'Account erstellen 🎉'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(false)}
                                        className="w-full py-4 rounded-2xl bg-transparent hover:bg-slate-50 text-slate-500 font-semibold transition-all"
                                    >
                                        Zurück zum Login
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        formAction={login}
                                        className="w-full py-4 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Anmelden
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(true)}
                                        className="w-full py-4 rounded-2xl bg-transparent hover:bg-slate-50 text-slate-500 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Noch kein Account? Registrieren
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>

                {/* Right Side: Visual */}
                <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-blue-600 relative p-12 items-center justify-center text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent scale-150" />

                    {/* Abstract 3D-like Cards in Background */}
                    <div className="absolute top-[20%] right-[-10%] w-48 h-32 bg-white/10 backdrop-blur-md rounded-2xl rotate-[-12deg] shadow-xl border border-white/20" />
                    <div className="absolute bottom-[20%] left-[-10%] w-48 h-32 bg-white/10 backdrop-blur-md rounded-2xl rotate-[12deg] shadow-xl border border-white/20" />

                    <div className="relative z-10 text-center space-y-6 max-w-sm">
                        <div className="inline-flex p-4 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl mb-4 animate-[float_6s_ease-in-out_infinite]">
                            <LayoutGrid className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold">Trete der Spiele Gemeinschaft bei</h2>
                        <p className="text-blue-100 text-lg leading-relaxed opacity-90">
                            Tritt Gruppen bei, plane Events und behalte den Überblick, wer welches Spiel mitbringt.
                        </p>

                        <div className="flex justify-center gap-[-10px] pt-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary backdrop-blur-sm -ml-3 first:ml-0" />
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-6 text-center text-sm text-slate-400 font-medium">
                Ultimate Board Game Hub © 2026
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
