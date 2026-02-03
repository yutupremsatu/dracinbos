import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = "G@cor123";

function isAuthenticated(req: Request) {
    const authHeader = req.headers.get('x-admin-secret');
    return authHeader === ADMIN_PASSWORD;
}

export async function POST(request: Request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, is_whitelisted, is_premium } = await request.json()

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server config missing Service Key' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const updateData: any = { updated_at: new Date().toISOString() }
    if (typeof is_whitelisted === 'boolean') updateData.is_whitelisted = is_whitelisted
    if (typeof is_premium === 'boolean') updateData.is_premium = is_premium

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
}
