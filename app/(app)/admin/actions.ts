'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmGodMode() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
        .from('profiles')
        .update({ has_seen_god_mode: true })
        .eq('id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
}

export async function sendPasswordReset(email: string) {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/update-password`,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

async function checkSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    return profile?.system_role === 'super_admin'
}

export async function getAllUsers() {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function getAllGroups() {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('groups')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function deleteUser(userId: string) {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/members')
    return { success: true }
}

export async function updateUserProfile(userId: string, data: any) {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/members')
    return { success: true }
}

export async function deleteAnyGroup(groupId: string) {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()
    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/groups')
    return { success: true }
}

export async function deleteAnyEvent(eventId: string) {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/events')
    return { success: true }
}

export async function getAdminStats() {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()

    const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: groupCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })

    const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

    const { count: listingCount } = await supabase
        .from('marketplace_listings')
        .select('*', { count: 'exact', head: true })

    const { data: recentReports } = await supabase
        .from('marketplace_reports')
        .select('*, marketplace_listings(title)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        users: userCount || 0,
        groups: groupCount || 0,
        events: eventCount || 0,
        listings: listingCount || 0,
        recentReports: recentReports || []
    }
}
export async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
    if (!await checkSuperAdmin()) throw new Error('Unauthorized')

    const supabase = await createClient()
    const { error } = await supabase
        .from('marketplace_reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reportId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/admin/reports')
    return { success: true }
}
