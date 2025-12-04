import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
    const email = `testuser${Date.now()}@gmail.com`
    const password = 'password123'

    console.log('Attempting signup with:', email)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('Signup Error:', error.message)
    } else {
        console.log('Signup Success:', data.user?.id)
        console.log('Check your email for confirmation link if enabled.')
    }
}

testAuth()
