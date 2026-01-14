'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
        .from('profiles')
        .update({ has_seen_onboarding: true })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating onboarding status:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath('/')
}
