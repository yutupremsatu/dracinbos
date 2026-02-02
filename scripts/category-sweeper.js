const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
            timeout: 10000,
            rejectUnauthorized: false
        };
        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
    });
};

const upsertToSupabase = async (data) => {
    if (!data.length) return;
    console.log(`[Supabase] Syncing ${data.length} records...`);
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
            res.on('end', () => resolve(true));
        });
        req.on('error', () => resolve(false));
        req.write(JSON.stringify(data));
        req.end();
    });
};

const humanize = (slug) => slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('=== CATEGORY SWEEPER START ===');

    const categories = ['Trending', 'Latest', 'Hot', 'Romance', 'CEO', 'Revenge', 'Fantasy', 'Family', 'Sci-fi', 'Youth'];
    const discovered = new Set();

    for (const cat of categories) {
        console.log(`[Sweeping] Category: ${cat}`);
        for (let p = 1; p <= 20; p++) { // Sweep 20 pages per category
            const url = `https://melolo.com/category/${cat.toLowerCase()}?page=${p}`;
            const html = await fetchURL(url);
            if (!html || html.length < 5000) break; // End of category

            const items = [];
            const matches = html.matchAll(/\/dramas\/([a-z0-9-]+)(\/[a-z0-9-]+)?/g);
            for (const m of matches) {
                const slug = m[1];
                if (m[0].split('/').length === 3 && !discovered.has(`melolo-${slug}`)) {
                    discovered.add(`melolo-${slug}`);
                    items.push({
                        platform_id: `melolo-${slug}`,
                        platform: 'melolo',
                        title: humanize(slug),
                        description: humanize(slug),
                        updated_at: new Date().toISOString()
                    });
                }
            }
            if (items.length > 0) {
                await upsertToSupabase(items);
            } else {
                break; // No new items on this page
            }
        }
    }

    console.log(`=== CATEGORY SWEEPER COMPLETE (Found ${discovered.size}) ===`);
}
run();
