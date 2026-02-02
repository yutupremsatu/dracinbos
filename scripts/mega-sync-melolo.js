const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
    });
};

const upsertToSupabase = async (data) => {
    if (!data.length) return;
    console.log(`[Supabase] Upserting ${data.length} records...`);

    return new Promise((resolve) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/dramas?on_conflict=platform_id`);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`[Supabase] Status: ${res.statusCode} ${res.statusMessage}`);
                resolve(true);
            });
        });
        req.on('error', (e) => {
            console.error(`[Supabase Error] ${e.message}`);
            resolve(false);
        });
        req.write(JSON.stringify(data));
        req.end();
    });
};

const humanize = (slug) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    console.log('--- Melolo Mega Sync ---');
    const sitemap = await fetchURL('https://melolo.com/sitemap.xml');
    const links = sitemap.match(/https:\/\/melolo\.com\/dramas\/[a-z0-9-]+/g) || [];
    const uniqueSlugs = [...new Set(links.map(l => l.split('/').pop()))];

    console.log(`Found ${uniqueSlugs.length} unique Melolo dramas.`);

    const dramas = uniqueSlugs.map(slug => ({
        platform_id: `melolo-${slug}`,
        platform: 'melolo',
        title: humanize(slug),
        description: `Short drama: ${humanize(slug)}`,
        cover_url: "",
        category: "General",
        updated_at: new Date().toISOString()
    }));

    // Batch upsert (Supabase/PostgREST limit is usually fine for 2000, but let's do 500 at a time)
    for (let i = 0; i < dramas.length; i += 500) {
        const batch = dramas.slice(i, i + 500);
        await upsertToSupabase(batch);
    }

    console.log('--- Melolo Sync Complete ---');
}

run();
