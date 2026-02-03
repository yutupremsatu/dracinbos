import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = "G@cor123";

function isAuthenticated(req: Request) {
    const authHeader = req.headers.get('x-admin-secret');
    return authHeader === ADMIN_PASSWORD;
}

export async function GET(request: Request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    let query = supabase.from('dramas').select('*', { count: 'exact' })

    if (search) {
        query = query.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await query
        .order('id', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        dramas: data,
        page,
        limit,
        total: count
    })
}

// DELETE drama
export async function DELETE(request: Request) {
    // 1. Check Auth (Fake Admin)
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Body
    let id;
    try {
        const body = await request.json();
        id = body.id;
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    // 3. Create Service Role Client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 4. Delete
    const { error } = await supabaseAdmin.from('dramas').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
