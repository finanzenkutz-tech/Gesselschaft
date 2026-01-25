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

    const { data, error } = await supabase
        .from('group_messages')
        .insert({
            group_id: groupId,
            user_id: user.id,
            content: content
        })
        .select(`
            *,
            profiles:user_id(full_name, avatar_url)
        `)
        .single()

    if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function deleteGroupMessage(messageId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting message:', error)
        return { success: false, error: error.message }
    }

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
    chat_id: string
    sender_id: string
    content: string
    created_at: string
    is_read: boolean
}

export async function sendMessage(chatId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!content.trim()) return { success: false, error: 'Message empty' }

    const { error } = await supabase
        .from('direct_messages')
        .insert({
            chat_id: chatId,
            sender_id: user.id,
            content: content
        })

    if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function getMessages(chatId: string): Promise<DirectMessage[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('chat_id', chatId)
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

    // Enrich with last message if needed
    return rawChats.map((c: any) => ({
        partnerId: c.profiles?.id,
        chatId: c.chat_id,
        partner: c.profiles,
        lastMessage: '...', // Placeholder or fetch latest
        lastMessageAt: c.profiles?.last_seen || new Date().toISOString(),
        unread: false
    }))
}
