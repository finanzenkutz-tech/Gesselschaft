'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bot, User, Clock, Brain, Users, PartyPopper, Swords, Handshake, ChevronRight, RotateCcw, Sparkles } from 'lucide-react'
import { getRecommendations, Recommendation, AdvisorCriteria } from '@/app/(app)/advisor/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export function GameAdvisorModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [criteria, setCriteria] = useState<AdvisorCriteria>({
        playerCount: 3,
        duration: 'any',
        complexity: 'any',
        mood: 'any'
    })
    const [results, setResults] = useState<Recommendation[]>([])

    const reset = () => {
        setStep(0)
        setResults([])
        setCriteria({
            playerCount: 3,
            duration: 'any',
            complexity: 'any',
            mood: 'any'
        })
    }

    const next = () => setStep(s => s + 1)

    const fetchResults = async (finalCriteria: AdvisorCriteria) => {
        setLoading(true)
        setStep(4) // Loading/Result step
        const recs = await getRecommendations(finalCriteria)
        // Artificial delay for "thinking" effect
        setTimeout(() => {
            setResults(recs)
            setLoading(false)
        }, 1200)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setTimeout(reset, 200) }}>
            <DialogContent className="sm:max-w-[450px] p-0 bg-slate-50 border-none rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[500px] flex flex-col" aria-describedby={undefined}>
                <VisuallyHidden><DialogTitle>Dr. Meeple Game Advisor</DialogTitle></VisuallyHidden>
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 pt-8 text-white flex items-center gap-4 shadow-lg shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold">Dr. Meeple</h2>
                        <p className="text-indigo-100 text-xs font-medium opacity-90">Dein KI-Spieleberater</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-slate-50">
                    <AnimatePresence mode="wait">

                        {/* Step 0: Intro & Players */}
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-6"
                            >
                                <ChatBubble isBot>
                                    Hallo! Ich helfe euch, das perfekte Spiel für heute zu finden. Wie viele Leute seid ihr? 🎲
                                </ChatBubble>

                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                    <div className="flex items-center justify-center gap-6">
                                        <button
                                            onClick={() => setCriteria(c => ({ ...c, playerCount: Math.max(1, c.playerCount - 1) }))}
                                            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                        >
                                            -
                                        </button>
                                        <div className="text-center w-20">
                                            <span className="text-4xl font-black text-slate-800">{criteria.playerCount}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Spieler</p>
                                        </div>
                                        <button
                                            onClick={() => setCriteria(c => ({ ...c, playerCount: Math.min(12, c.playerCount + 1) }))}
                                            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <Button onClick={next} className="w-full mt-6 rounded-xl h-12 font-bold bg-violet-600 hover:bg-violet-700">
                                        Weiter <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Time */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-6"
                            >
                                <ChatBubble isBot>
                                    Alles klar, {criteria.playerCount} Personen. Wie viel Zeit habt ihr mitgebracht? ⏱️
                                </ChatBubble>

                                <div className="grid grid-cols-1 gap-3">
                                    <SelectButton
                                        icon={<Clock className="w-5 h-5" />}
                                        label="Nur ein Quickie"
                                        sub="Unter 60 Min"
                                        onClick={() => { setCriteria(c => ({ ...c, duration: 'short' })); next() }}
                                    />
                                    <SelectButton
                                        icon={<Clock className="w-5 h-5 text-orange-500" />}
                                        label="Standard"
                                        sub="60 - 120 Min"
                                        onClick={() => { setCriteria(c => ({ ...c, duration: 'medium' })); next() }}
                                    />
                                    <SelectButton
                                        icon={<Clock className="w-5 h-5 text-red-500" />}
                                        label="Epischer Abend"
                                        sub="Über 2 Stunden"
                                        onClick={() => { setCriteria(c => ({ ...c, duration: 'long' })); next() }}
                                    />
                                    <SelectButton
                                        icon={<Clock className="w-5 h-5 text-slate-400" />}
                                        label="Egal"
                                        sub="Wir haben Zeit"
                                        onClick={() => { setCriteria(c => ({ ...c, duration: 'any' })); next() }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Vibe/Mood */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="space-y-6"
                            >
                                <ChatBubble isBot>
                                    Verstanden! Und worauf habt ihr heute Lust? 🎭
                                </ChatBubble>

                                <div className="grid grid-cols-2 gap-3">
                                    <BigSelectButton
                                        icon={<Brain className="w-8 h-8 text-blue-500" />}
                                        label="Strategie"
                                        onClick={() => fetchResults({ ...criteria, mood: 'strategy' })}
                                    />
                                    <BigSelectButton
                                        icon={<PartyPopper className="w-8 h-8 text-pink-500" />}
                                        label="Fun & Party"
                                        onClick={() => fetchResults({ ...criteria, mood: 'fun' })}
                                    />
                                    <BigSelectButton
                                        icon={<Handshake className="w-8 h-8 text-green-500" />}
                                        label="Kooperativ"
                                        onClick={() => fetchResults({ ...criteria, mood: 'coop' })}
                                    />
                                    <BigSelectButton
                                        icon={<Sparkles className="w-8 h-8 text-amber-500" />}
                                        label="Überrasch mich"
                                        onClick={() => fetchResults({ ...criteria, mood: 'any' })}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Loading */}
                        {step === 4 && loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full space-y-4 py-10"
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-violet-600 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-slate-500 font-bold animate-pulse">Analysiere Sammlung...</p>
                            </motion.div>
                        )}

                        {/* Step 4: Results */}
                        {step === 4 && !loading && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6 pb-4"
                            >
                                <ChatBubble isBot>
                                    Hier sind meine Top-Empfehlungen für euch! 🎉
                                </ChatBubble>

                                {results.length === 0 ? (
                                    <div className="text-center p-8 bg-slate-100 rounded-3xl">
                                        <p className="text-slate-500 font-medium">Hmm, ich konnte in deiner Sammlung leider nichts passendes finden. 🙈</p>
                                        <Button onClick={reset} variant="link" className="mt-2 text-violet-600">Nochmal versuchen</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {results.map((game, i) => (
                                            <div key={game.gameId} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                                <div className="flex gap-4">
                                                    <div className="w-20 h-20 bg-slate-100 rounded-2xl shrink-0 overflow-hidden">
                                                        {game.imageUrl ? (
                                                            <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                                                        ) : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl">?</div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate pr-2">{game.name}</h3>
                                                            {i === 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Top</span>}
                                                        </div>
                                                        <p className="text-xs text-violet-600 font-bold mt-1 line-clamp-1">{game.reason}</p>

                                                        <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-400 uppercase">
                                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {game.specs.players}</span>
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {game.specs.time}</span>
                                                            <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {game.specs.weight}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button onClick={reset} variant="outline" className="w-full rounded-xl border-slate-200">
                                    <RotateCcw className="w-4 h-4 mr-2" /> Neue Suche
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}


function ChatBubble({ children, isBot }: { children: React.ReactNode, isBot?: boolean }) {
    return (
        <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
            {isBot && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm mt-auto">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}
            <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${isBot
                ? 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                : 'bg-violet-600 text-white rounded-br-none'
                }`}>
                {children}
            </div>
        </div>
    )
}

function SelectButton({ icon, label, sub, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md hover:bg-violet-50 transition-all flex items-center gap-4 text-left group"
        >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-violet-600 transition-colors">
                {icon}
            </div>
            <div>
                <p className="font-bold text-slate-700 group-hover:text-violet-900">{label}</p>
                <p className="text-xs text-slate-400 font-medium">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-violet-400" />
        </button>
    )
}

function BigSelectButton({ icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="aspect-square bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 text-center group"
        >
            <div className="group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <p className="font-bold text-slate-700 text-sm group-hover:text-violet-900">{label}</p>
        </button>
    )
}
