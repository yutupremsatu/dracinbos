import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Get drama count
        const { count: dramaCount } = await supabase
            .from("dramas")
            .select("*", { count: "exact", head: true });

        // Get user count
        const { count: userCount } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });

        // Get platform count (distinct)
        const { data: platforms } = await supabase
            .from("dramas")
            .select("platform")
            .limit(1000);

        const uniquePlatforms = platforms
            ? new Set(platforms.map(p => p.platform)).size
            : 0;

        return NextResponse.json({
            totalDramas: dramaCount ?? 0,
            totalUsers: userCount ?? 0,
            totalPlatforms: uniquePlatforms,
            lastSync: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({
            totalDramas: 0,
            totalUsers: 0,
            totalPlatforms: 0,
            lastSync: "Error",
        });
    }
}
