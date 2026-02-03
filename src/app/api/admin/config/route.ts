import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // Public read
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', 'apk_url')
        .single()

    if (error) {
        // Fallback or error
        return NextResponse.json({ apk_url: '/dracin_1.0.0.apk' }) // Default fallback if DB fails
    }

    return NextResponse.json({ apk_url: data?.value || '/dracin_1.0.0.apk' })
}

export async function POST(request: Request) {
    const { apk_url } = await request.json()

    if (!apk_url) {
        return NextResponse.json({ error: 'Missing apk_url' }, { status: 400 })
    }

    // Use Service Role Key for Admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server configuration error: Missing Secret Key' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const { data, error } = await supabaseAdmin
        .from('app_config')
        .upsert({
            key: 'apk_url',
            value: apk_url,
            description: 'Direct download link for the Android APK',
            updated_at: new Date().toISOString()
        })
        .select()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}
