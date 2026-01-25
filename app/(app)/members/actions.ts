
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMember(formData: {
    email: string
    fullName: string
    password?: string
    isTeacher?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Nicht eingeloggt' }
    }

    // Check if current user is admin
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.system_role !== 'super_admin' && currentUserProfile?.system_role !== 'admin') {
        return { success: false, error: 'Keine Berechtigung' }
    }

    const adminClient = createAdminClient()

    // Generate random password if not provided
    const password = formData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    const { data, error } = await adminClient.auth.admin.createUser({
        email: formData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.fullName
        }
    })

    if (error) {
        console.error('Error creating user:', error)
        return { success: false, error: error.message }
    }

    // 3. Update Profile with is_teacher if needed
    if (formData.isTeacher) {
        await adminClient
            .from('profiles')
            .update({ is_teacher: true })
            .eq('id', data.user.id)
    }

    revalidatePath('/members')
    return { success: true, userId: data.user.id, password }
}
