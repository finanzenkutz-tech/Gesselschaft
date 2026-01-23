'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

export async function joinGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Check if already a member
    const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        return { success: false, error: 'Du bist bereits Mitglied' }
    }

    // Add as member
    const { error } = await supabase
        .from('group_members')
        .insert({
            group_id: groupId,
            user_id: user.id,
            role: 'member'
        })

    if (error) {
        console.error('Error joining group:', error)
        return { success: false, error: error.message }
    }

    // Send email notifications to other members
    try {
        const { data: group } = await supabase.from('groups').select('name').eq('id', groupId).single()
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

        if (group && profile) {
            const { data: members } = await supabase
                .from('group_members')
                .select(`
                    user_id,
                    profiles (
                        email,
                        full_name,
                        pref_email_notifications
                    )
                `)
                .eq('group_id', groupId)
                .neq('user_id', user.id)

            if (members) {
                const recipients = members
                    .map((m: any) => m.profiles)
                    .filter((p: any) => p && p.email && p.pref_email_notifications !== false)

                // Send emails in parallel (fire and forget to not block UI too long, or await if critical)
                // Using Promise.allSettled to avoid one failure stopping others
                await Promise.allSettled(recipients.map((recipient: any) =>
                    sendEmail({
                        to: recipient.email,
                        subject: `Neues Mitglied in ${group.name} 🎲`,
                        html: `
                            <div style="font-family: sans-serif; color: #333;">
                                <h2>Neues Gruppenmitglied!</h2>
                                <p>Hallo ${recipient.full_name || 'Spieler'},</p>
                                <p><strong>${profile.full_name || 'Jemand'}</strong> ist der Gruppe <strong>${group.name}</strong> beigetreten.</p>
                                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/groups/${groupId}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Zur Gruppe</a></p>
                            </div>
                        `
                    })
                ))
            }
        }
    } catch (emailError) {
        console.error('Error sending welcome emails:', emailError)
        // Don't fail the join action just because emails failed
    }

    revalidatePath(`/groups/${groupId}`)
    revalidatePath('/groups')
    revalidatePath('/')
    return { success: true }
}

export async function leaveGroup(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error leaving group:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    revalidatePath('/groups')
    revalidatePath('/')
    return { success: true }
}
