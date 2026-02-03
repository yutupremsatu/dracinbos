import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = "G@cor123";

function isAuthenticated(req: Request) {
    const authHeader = req.headers.get('x-admin-secret');
    return authHeader === ADMIN_PASSWORD;
}

export async function GET(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from('app_config')
        .select('*')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert array to key-value object
    const config: Record<string, string> = {}
    data?.forEach(item => {
        config[item.key] = item.value
    })

    return NextResponse.json(config)
}

export async function POST(request: Request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apk_url, premium_mode } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server configuration error: Missing Secret Key' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const updates = []

    if (apk_url !== undefined) {
        updates.push(supabaseAdmin.from('app_config').upsert({
            key: 'apk_url', value: apk_url, updated_at: new Date().toISOString()
        }))
    }

    if (premium_mode !== undefined) {
        updates.push(supabaseAdmin.from('app_config').upsert({
            key: 'premium_mode', value: premium_mode, updated_at: new Date().toISOString()
        }))
    }

    if (updates.length === 0) {
        return NextResponse.json({ error: 'No data to update' }, { status: 400 })
    }

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error).map(r => r.error?.message)

    if (errors.length > 0) {
        return NextResponse.json({ error: errors.join(', ') }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
