'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getOrCreateDirectChat(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    if (user.id === otherUserId) return { success: false, error: 'Du kannst nicht mit dir selbst chatten' }

    // 1. Check if chat exists
    // We want a chat where participants are EXACTLY [user.id, otherUserId]
    // Or just "contain both". For DMs, usually unique pair.

    // Find chat_ids specific to user
    const { data: myChats } = await supabase
        .from('direct_chat_participants')
        .select('chat_id')
        .eq('user_id', user.id)

    const myChatIds = myChats?.map(c => c.chat_id) || []

    if (myChatIds.length > 0) {
        // Find if other user is in any of these chats
        const { data: commonChats } = await supabase
            .from('direct_chat_participants')
            .select('chat_id')
            .eq('user_id', otherUserId)
            .in('chat_id', myChatIds)
        // Assuming 1:1 chats, there should be at most one common chat that is a DM
        // If we had group chats in same table, we'd need to check participant count = 2

        if (commonChats && commonChats.length > 0) {
            // Found existing chat
            return { success: true, chatId: commonChats[0].chat_id }
        }
    }

    // 2. Create new chat
    const { data: newChat, error: createError } = await supabase
        .from('direct_chats')
        .insert({})
        .select()
        .single()

    if (createError || !newChat) {
        console.error('Error creating chat:', createError)
        return { success: false, error: 'Fehler beim Erstellen des Chats' }
    }

    const chatId = newChat.id

    // 3. Add participants
    const { error: partError } = await supabase
        .from('direct_chat_participants')
        .insert([
            { chat_id: chatId, user_id: user.id },
            { chat_id: chatId, user_id: otherUserId }
        ])

    if (partError) {
        console.error('Error adding participants:', partError)
        return { success: false, error: 'Fehler beim Hinzufügen der Teilnehmer' }
    }

    revalidatePath('/chat')
    return { success: true, chatId }
}

export async function getDirectMessages(chatId: string) {
    const supabase = await createClient()

    // Check access implicitly via RLS, but helpful to verify
    const { data, error } = await supabase
        .from('direct_messages')
        .select(`
            *,
            sender:profiles!sender_id(full_name, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data
}

export async function sendDirectMessage(chatId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    if (!content.trim()) return { success: false, error: 'Nachricht leer' }

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

export async function getMyDirectChats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get my chat IDs
    const { data: myChats } = await supabase
        .from('direct_chat_participants')
        .select('chat_id')
        .eq('user_id', user.id)

    const chatIds = myChats?.map(c => c.chat_id) || []

    if (chatIds.length === 0) return []

    // Get details for these chats
    // We want the OTHER participant info
    const { data: chatsWithPart } = await supabase
        .from('direct_chat_participants')
        .select(`
            chat_id,
            profiles(id, full_name, avatar_url, last_seen)
        `)
        .in('chat_id', chatIds)
        .neq('user_id', user.id) // Get the partner

    return chatsWithPart || []
}
