import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = "G@cor123"; // Should be in env, but matching client-side hardcode for now

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

    // List users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
}
