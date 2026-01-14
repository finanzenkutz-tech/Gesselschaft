import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getConversations } from '@/app/chat/actions'
import { ConversationList } from '@/components/chat/conversation-list'
import { MessageCircle } from 'lucide-react'

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const conversations = await getConversations()

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <MessageCircle className="w-8 h-8 text-primary" />
                    Nachrichten
                </h1>
                <p className="text-slate-500 text-lg mt-1">
                    Deine privaten Unterhaltungen
                </p>
            </header>

            <div className="sky-card p-0 overflow-hidden">
                <ConversationList conversations={conversations} />
            </div>

            {conversations.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Noch keine Chats</h2>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Gehe zu deinem Profil und starte einen Chat mit einem deiner Buddies!
                    </p>
                </div>
            )}
        </div>
    )
}
