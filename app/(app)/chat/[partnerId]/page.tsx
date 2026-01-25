import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyDirectChats, getOrCreateDirectChat } from '../direct-actions'
import { ConversationList } from '@/components/chat/conversation-list'
import { ChatWindow } from '@/components/chat/chat-window'

export default async function ChatConversationPage({
    params
}: {
    params: Promise<{ partnerId: string }>
}) {
    const { partnerId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Get or Create the Chat Room
    const chatResult = await getOrCreateDirectChat(partnerId)
    if (!chatResult.success || !chatResult.chatId) {
        console.error('Failed to get/create chat:', chatResult.error)
        // Optionally redirect or show error
    }

    const rawChats = await getMyDirectChats()

    // Transform to the expected format
    const conversations = rawChats.map((c: any) => ({
        partnerId: c.profiles?.id || c.chat_id,
        chatId: c.chat_id,
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unread: false,
        partner: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    }))

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
                {/* Conversation List - hidden on mobile when viewing chat */}
                <div className="hidden lg:block sky-card p-0 overflow-hidden h-full">
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <h2 className="font-bold text-lg text-slate-800">Chats</h2>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-60px)]">
                        <ConversationList
                            conversations={conversations}
                            activePartnerId={partnerId}
                        />
                    </div>
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2 sky-card p-0 overflow-hidden h-full">
                    <ChatWindow
                        chatId={chatResult.chatId || ''}
                        partnerId={partnerId}
                        currentUserId={user.id}
                    />
                </div>
            </div>
        </div>
    )
}
