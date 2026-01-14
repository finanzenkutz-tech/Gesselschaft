'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Deutsche Übersetzungen für Supabase Fehlermeldungen
function translateError(errorMessage: string): string {
    const translations: Record<string, string> = {
        'Invalid login credentials': 'E-Mail oder Passwort ist falsch',
        'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail-Adresse',
        'User already registered': 'Diese E-Mail ist bereits registriert',
        'Password should be at least 6 characters': 'Das Passwort muss mindestens 6 Zeichen haben',
        'Unable to validate email address: invalid format': 'Ungültiges E-Mail-Format',
        'Signup requires a valid password': 'Bitte gib ein Passwort ein',
        'To signup, please provide your email': 'Bitte gib eine E-Mail-Adresse ein',
    }

    return translations[errorMessage] || errorMessage
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        const germanError = translateError(error.message)
        redirect(`/login?error=${encodeURIComponent(germanError)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    })

    if (error) {
        const germanError = translateError(error.message)
        redirect(`/login?error=${encodeURIComponent(germanError)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const headersList = await (await import('next/headers')).headers()
    const origin = headersList.get('origin')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
    })

    if (error) {
        const germanError = translateError(error.message)
        redirect(`/login?error=${encodeURIComponent(germanError)}`)
    }

    redirect(`/login?message=${encodeURIComponent('Bitte prüfe deine E-Mails für den Reset-Link')}`)
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

