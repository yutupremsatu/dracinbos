import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Create client LOCALLY to ensure env vars are loaded first
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-key";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("🔍 Checking Supabase Data...");

    const { count, error } = await supabase
        .from('dramas')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    console.log(`✅ Total Dramas in Database: ${count}`);

    // Show last 3 entries
    const { data } = await supabase
        .from('dramas')
        .select('title, platform_id, updated_at, cover_url')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (data && data.length > 0) {
        console.log("\nRecent Entries:");
        data.forEach(d => {
            console.log(`- [${d.platform_id}] ${d.title}`);
            console.log(`  Cover: ${d.cover_url}`);
        });
    }
}

checkData();
