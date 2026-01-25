'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateChallengeData {
    challengerGroupId: string
    challengedGroupId: string
    message?: string
    proposedDate?: string
}

export async function createChallenge(data: CreateChallengeData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Verify user is admin of challenger group
    const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', data.challengerGroupId)
        .eq('user_id', user.id)
        .single()

    if (membership?.role !== 'admin') {
        return { success: false, error: 'Nur Gruppen-Admins können Herausforderungen senden' }
    }

    // Check for existing pending challenge
    const { data: existing } = await supabase
        .from('group_challenges')
        .select('id')
        .eq('challenger_group_id', data.challengerGroupId)
        .eq('challenged_group_id', data.challengedGroupId)
        .eq('status', 'pending')
        .single()

    if (existing) {
        return { success: false, error: 'Eine Herausforderung an diese Gruppe ist bereits ausstehend' }
    }

    const { error } = await supabase
        .from('group_challenges')
        .insert({
            challenger_group_id: data.challengerGroupId,
            challenged_group_id: data.challengedGroupId,
            message: data.message || null,
            proposed_date: data.proposedDate || null,
            created_by: user.id,
            status: 'pending'
        })

    if (error) {
        console.error('Challenge creation error:', error)
        return { success: false, error: 'Herausforderung konnte nicht gesendet werden' }
    }

    revalidatePath(`/groups/${data.challengerGroupId}`)
    revalidatePath(`/groups/${data.challengedGroupId}`)
    return { success: true }
}

export async function respondToChallenge(
    challengeId: string,
    accept: boolean,
    responseMessage?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Get challenge to verify permissions
    const { data: challenge } = await supabase
        .from('group_challenges')
        .select('*, challenged_group_id')
        .eq('id', challengeId)
        .single()

    if (!challenge) {
        return { success: false, error: 'Herausforderung nicht gefunden' }
    }

    // Verify user is admin of challenged group
    const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', challenge.challenged_group_id)
        .eq('user_id', user.id)
        .single()

    if (membership?.role !== 'admin') {
        return { success: false, error: 'Nur Gruppen-Admins können auf Herausforderungen antworten' }
    }

    const { error } = await supabase
        .from('group_challenges')
        .update({
            status: accept ? 'accepted' : 'declined',
            response_message: responseMessage || null,
            responded_by: user.id,
            responded_at: new Date().toISOString()
        })
        .eq('id', challengeId)

    if (error) {
        console.error('Challenge response error:', error)
        return { success: false, error: 'Antwort konnte nicht gespeichert werden' }
    }

    revalidatePath(`/groups/${challenge.challenger_group_id}`)
    revalidatePath(`/groups/${challenge.challenged_group_id}`)
    return { success: true }
}

export async function cancelChallenge(challengeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data: challenge } = await supabase
        .from('group_challenges')
        .select('challenger_group_id, challenged_group_id, status')
        .eq('id', challengeId)
        .single()

    if (!challenge || challenge.status !== 'pending') {
        return { success: false, error: 'Herausforderung kann nicht abgebrochen werden' }
    }

    // Verify user is admin of challenger group
    const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', challenge.challenger_group_id)
        .eq('user_id', user.id)
        .single()

    if (membership?.role !== 'admin') {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const { error } = await supabase
        .from('group_challenges')
        .delete()
        .eq('id', challengeId)

    if (error) {
        console.error('Challenge cancel error:', error)
        return { success: false, error: 'Konnte nicht abgebrochen werden' }
    }

    revalidatePath(`/groups/${challenge.challenger_group_id}`)
    revalidatePath(`/groups/${challenge.challenged_group_id}`)
    return { success: true }
}

export async function getChallengesForGroup(groupId: string) {
    const supabase = await createClient()

    // Get incoming challenges (where this group is challenged)
    const { data: incoming } = await supabase
        .from('group_challenges')
        .select(`
            *,
            challenger_group:challenger_group_id(id, name),
            created_by_profile:created_by(full_name)
        `)
        .eq('challenged_group_id', groupId)
        .order('created_at', { ascending: false })

    // Get outgoing challenges (where this group is the challenger)
    const { data: outgoing } = await supabase
        .from('group_challenges')
        .select(`
            *,
            challenged_group:challenged_group_id(id, name),
            responded_by_profile:responded_by(full_name)
        `)
        .eq('challenger_group_id', groupId)
        .order('created_at', { ascending: false })

    return {
        incoming: incoming || [],
        outgoing: outgoing || []
    }
}

export async function updateGroupLocation(
    groupId: string,
    latitude: number,
    longitude: number,
    locationName: string,
    isPublic: boolean = true
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Verify user is admin
    const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (membership?.role !== 'admin') {
        return { success: false, error: 'Nur Admins können den Standort ändern' }
    }

    const { error } = await supabase
        .from('groups')
        .update({
            latitude,
            longitude,
            location_name: locationName,
            is_location_public: isPublic
        })
        .eq('id', groupId)

    if (error) {
        console.error('Location update error:', error)
        return { success: false, error: 'Standort konnte nicht aktualisiert werden' }
    }

    revalidatePath(`/groups/${groupId}`)
    revalidatePath('/groups/map')
    return { success: true }
}

export async function getGroupsWithLocations() {
    const supabase = await createClient()

    const { data: groups } = await supabase
        .from('groups')
        .select(`
            id, name, description, latitude, longitude, location_name,
            group_members(count)
        `)
        .eq('is_location_public', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

    return groups || []
}
