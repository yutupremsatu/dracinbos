import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSearch(keyword: string) {
    console.log(`🔍 Debugging Search for: "${keyword}"`);

    // 1. Check raw count with broad filter
    const { data: rawData, error: rawError } = await supabase
        .from('dramas')
        .select('title, platform_id, platform')
        .ilike('title', `%${keyword}%`);

    if (rawError) {
        console.error("❌ Database Error:", rawError.message);
        return;
    }

    console.log(`\nFound ${rawData?.length || 0} matches:`);
    rawData?.forEach(d => console.log(`- [${d.platform}] ${d.title} (ID: ${d.platform_id})`));

    // 2. Dump first 5 titles to check formatting
    if (rawData?.length === 0) {
        console.log("\n⚠️ Sample of ALL titles in DB (to check formatting):");
        const { data: sample } = await supabase.from('dramas').select('title').limit(5);
        sample?.forEach(d => console.log(`- ${d.title}`));
    }
}

const query = process.argv[2] || "Jodoh";
debugSearch(query);
