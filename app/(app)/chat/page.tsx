import { getUserGroups } from './actions'
import { getMyDirectChats } from './direct-actions'
import { ChatInterface } from './chat-interface'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Chat | BoardGameHub',
    description: 'Chatte mit deinen Gruppen.'
}

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const groups = await getUserGroups()
    const directChats = await getMyDirectChats()

    return (
        <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mx-4 md:mt-0 md:mx-auto max-w-7xl relative">
            <ChatInterface user={user} groups={groups} directChats={directChats as any} />
        </div>
    )
}
