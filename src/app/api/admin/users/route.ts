import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "G@cor123";

// Use Service Role to access auth.users
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
    // Check admin secret
    const secret = request.headers.get("x-admin-secret");
    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch users from Supabase Auth using admin API
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error("Error fetching users:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            users: data.users || [],
            total: data.users?.length || 0
        });
    } catch (err: any) {
        console.error("Users API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Check admin secret
    const secret = request.headers.get("x-admin-secret");
    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        // Delete user using admin API
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Error deleting user:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Delete user error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
