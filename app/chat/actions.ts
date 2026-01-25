'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMyDirectChats } from './direct-actions'

export async function getGroupMessages(groupId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('group_messages')
        .select(`
            *,
            profiles:user_id(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true }) // Oldest first for chat log

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data
}

export async function sendGroupMessage(groupId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!content.trim()) return { success: false, error: 'Message empty' }

    const { error } = await supabase
        .from('group_messages')
        .insert({
            group_id: groupId,
            user_id: user.id,
            content: content
        })

    if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
    }

    // No need to revalidate path if we use Realtime, but for fallback:
    return { success: true }
}

export async function getUserGroups() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('group_members')
        .select(`
            group_id,
            groups(id, name, emoji)
        `)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching user groups:', error)
        return []
    }

    return data.map((item: any) => item.groups)
}

// Direct Message Types and Functions
export type DirectMessage = {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    read_at: string | null
}

export async function sendMessage(partnerId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!content.trim()) return { success: false, error: 'Message empty' }

    const { error } = await supabase
        .from('direct_messages')
        .insert({
            sender_id: user.id,
            receiver_id: partnerId,
            content: content
        })

    if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function getMessages(partnerId: string): Promise<DirectMessage[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data || []
}

export async function getChatPartner(partnerId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen')
        .eq('id', partnerId)
        .single()

    if (error) {
        console.error('Error fetching partner:', error)
        return null
    }

    return data
}

export async function getConversations() {
    const rawChats = await getMyDirectChats()

    return rawChats.map((c: any) => ({
        partnerId: c.profiles?.id || c.chat_id,
        lastMessage: '...',
        lastMessageAt: new Date().toISOString(),
        unread: false,
        partner: c.profiles
    }))
}
