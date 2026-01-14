'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password) {
        redirect('/update-password?error=Passwort ist erforderlich')
    }

    if (password !== confirmPassword) {
        redirect('/update-password?error=Passwörter stimmen nicht überein')
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        redirect(`/update-password?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
