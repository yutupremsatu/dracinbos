const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
    });
};

const upsertToSupabase = async (data) => {
    if (!data.length) return;
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
        req.write(JSON.stringify(data));
        req.end();
    });
};

const humanize = (slug) => slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- ReelShort Sub-Sitemap Drain ---');

    const indexData = await fetchURL('https://www.reelshort.com/sitexml/sitemap.xml');
    const subs = indexData.match(/https?:\/\/[^<]+\.xml/g) || [];
    console.log(`Found ${subs.length} sub-sitemaps.`);

    const allDramas = [];
    for (const s of subs) {
        console.log(`  Fetching: ${s}`);
        const subData = await fetchURL(s);
        const links = subData.match(/https?:\/\/www\.reelshort\.com\/book\/([a-z0-9-]+)/g) || [];

        for (const l of links) {
            const slug = l.split('/').pop();
            allDramas.push({
                platform_id: `reelshort-${slug}`,
                platform: 'reelshort',
                title: humanize(slug),
                description: humanize(slug),
                cover_url: "",
                updated_at: new Date().toISOString()
            });
        }
    }

    if (allDramas.length > 0) {
        const unique = Array.from(new Map(allDramas.map(r => [r.platform_id, r])).values());
        console.log(`Found ${unique.length} unique titles! Syncing to Supabase...`);
        for (let i = 0; i < unique.length; i += 500) await upsertToSupabase(unique.slice(i, i + 500));
    }

    console.log('--- ReelShort Drain Complete ---');
}
run();
