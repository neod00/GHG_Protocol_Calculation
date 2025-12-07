'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

function validateEmail(email: string): string | null {
    const cleaned = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(cleaned)) {
        return cleaned
    }
    return null
}

type LoginState = 
    | { error: string }
    | { success: boolean; redirect: string }

export async function login(prevState: LoginState | null, formData: FormData): Promise<LoginState> {
    const supabase = await createClient()

    // Get raw inputs
    const emailInput = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate email
    const email = validateEmail(emailInput)
    if (!email) {
        return { error: 'Please enter a valid email address.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Invalid credentials. Please try again.' }
    }

    // Verify session was created
    if (!data.session) {
        return { error: 'Failed to create session. Please try again.' }
    }

    // Verify user exists
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Failed to authenticate. Please try again.' }
    }

    revalidatePath('/', 'layout')
    // Return success state - client will handle redirect
    return { success: true, redirect: '/dashboard' }
}

export async function signup(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const emailInput = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const fullName = formData.get('fullName') as string

    const email = validateEmail(emailInput)
    if (!email) {
        return { error: 'Please enter a valid email address.' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }



    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/confirmed`,
            data: {
                full_name: fullName,
            }
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check your email to continue sign in process')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
