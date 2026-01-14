import { login, signup, signInWithGoogle } from './actions'
import { Dice5, LayoutGrid, Chrome } from 'lucide-react' // Using Chrome as placeholder for Google if needed, or SVG

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string, error?: string }>
}) {
    const params = await searchParams

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
                            Willkommen zurück!
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Logge dich ein, um deinen nächsten Spieleabend zu planen.
                        </p>
                    </div>

                    <form className="space-y-5 max-w-sm">
                        {/* Admin Credentials Hint */}
                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-sm text-sky-800 mb-4">
                            <p className="font-bold mb-1">👑 Admin Login:</p>
                            <code className="block bg-white/50 p-1 rounded">admin@example.com</code>
                            <code className="block bg-white/50 p-1 rounded mt-1">password123</code>
                        </div>

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

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1" htmlFor="password">
                                Passwort
                            </label>
                            <input
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {params?.error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                                <span>⚠️</span> {params.error}
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <button
                                formAction={login}
                                className="w-full py-4 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Anmelden
                            </button>

                            <button
                                formAction={signInWithGoogle}
                                className="w-full py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold border-2 border-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Mit Google anmelden
                            </button>

                            <button
                                formAction={signup}
                                className="w-full py-4 rounded-2xl bg-transparent hover:bg-slate-50 text-slate-500 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Neuen Account erstellen
                            </button>
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
