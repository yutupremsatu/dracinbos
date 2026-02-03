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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server config missing Service Key' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // List users with profile data
    const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select(`
            id,
            is_whitelisted,
            is_premium,
            updated_at,
            auth_user:id (
                email,
                app_metadata,
                last_sign_in_at,
                created_at
            )
        `)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten the data for easier UI consumption
    const flattenedUsers = users.map((u: any) => ({
        id: u.id,
        is_whitelisted: u.is_whitelisted,
        is_premium: u.is_premium,
        updated_at: u.updated_at,
        email: u.auth_user?.email,
        provider: u.auth_user?.app_metadata?.provider || 'Email',
        last_sign_in_at: u.auth_user?.last_sign_in_at,
        created_at: u.auth_user?.created_at
    }))

    return NextResponse.json({ users: flattenedUsers })
}
