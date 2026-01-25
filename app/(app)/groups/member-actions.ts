'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'
import { createNotification } from '@/app/(app)/notifications/actions'

export async function joinGroup(groupId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: 'Nicht authentifiziert' }

        // Check if already a member
        const { data: existing, error: checkError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (checkError) {
            console.error('Error checking membership:', checkError)
            return { success: false, error: 'Fehler bei der Mitgliederprüfung: ' + checkError.message }
        }

        if (existing) {
            return { success: false, error: 'Du bist bereits Mitglied dieser Gruppe.' }
        }

        // Add as member
        const { error: insertError } = await supabase
            .from('group_members')
            .insert({
                group_id: groupId,
                user_id: user.id,
                role: 'member'
            })

        if (insertError) {
            console.error('Error joining group:', insertError)
            // Specific handle for unique constraint if race condition occurred
            if (insertError.code === '23505') return { success: false, error: 'Du bist bereits Mitglied.' }
            return { success: false, error: 'Beitritt fehlgeschlagen: ' + insertError.message }
        }

        // Send email notifications to other members (background task)
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

                    await Promise.allSettled([
                        ...recipients.map((recipient: any) =>
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
                        ),
                        ...(members || []).map((m: any) =>
                            createNotification(
                                m.user_id,
                                'group_join',
                                'Neues Gruppenmitglied',
                                `${profile.full_name || 'Jemand'} ist der Gruppe ${group.name} beigetreten.`,
                                `/groups/${groupId}`
                            )
                        )
                    ])
                }
            }
        } catch (emailError) {
            console.error('Error sending welcome emails:', emailError)
        }

        revalidatePath(`/groups/${groupId}`)
        revalidatePath('/groups')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in joinGroup:', e)
        return { success: false, error: 'Netzwerk- oder Serverfehler: ' + (e.message || 'Unbekannter Fehler') }
    }
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

