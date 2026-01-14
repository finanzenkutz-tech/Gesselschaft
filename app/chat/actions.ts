'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DirectMessage = {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    read_at: string | null
    created_at: string
    sender?: {
        id: string
        full_name: string | null
        avatar_url: string | null
    }
}

// Get all conversations (unique chat partners)
export async function getConversations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get all unique users we've chatted with
    const { data: messages } = await supabase
        .from('direct_messages')
        .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            read_at
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

    if (!messages) return []

    // Group by chat partner and get last message
    const conversationsMap = new Map<string, any>()

    for (const msg of messages) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id

        if (!conversationsMap.has(partnerId)) {
            conversationsMap.set(partnerId, {
                partnerId,
                lastMessage: msg.content,
                lastMessageAt: msg.created_at,
                unread: msg.receiver_id === user.id && !msg.read_at
            })
        } else {
            // Count unread
            if (msg.receiver_id === user.id && !msg.read_at) {
                conversationsMap.get(partnerId).unread = true
            }
        }
    }

    // Get partner profiles
    const partnerIds = Array.from(conversationsMap.keys())
    if (partnerIds.length === 0) return []

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen')
        .in('id', partnerIds)

    // Merge profile data
    const conversations = Array.from(conversationsMap.values()).map(conv => ({
        ...conv,
        partner: profiles?.find(p => p.id === conv.partnerId) || null
    }))

    return conversations.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )
}

// Get messages with a specific user
export async function getMessages(partnerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: messages, error } = await supabase
        .from('direct_messages')
        .select(`
            *,
            sender:profiles!direct_messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    // Mark received messages as read
    await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .is('read_at', null)

    return messages as DirectMessage[]
}

// Send a message
export async function sendMessage(receiverId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    if (!content.trim()) {
        return { success: false, error: 'Nachricht darf nicht leer sein' }
    }

    const { data, error } = await supabase
        .from('direct_messages')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content.trim()
        })
        .select()
        .single()

    if (error) {
        console.error('Error sending message:', error)
        return { success: false, error: error.message }
    }

    // Create notification for receiver
    const { createNotification } = await import('@/app/notifications/actions')
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    await createNotification(
        receiverId,
        'message',
        'Neue Nachricht',
        `${profile?.full_name || 'Jemand'} hat dir eine Nachricht gesendet`,
        `/chat/${user.id}`
    )

    revalidatePath('/chat')
    return { success: true, message: data }
}

// Get unread message count
export async function getUnreadCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null)

    return count || 0
}

// Get partner profile
export async function getChatPartner(partnerId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen')
        .eq('id', partnerId)
        .single()

    return data
}
