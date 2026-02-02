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

async function discoverMelolo() {
    console.log('[Melolo] Starting Recursive Discovery...');
    const knownSlugs = new Set();
    const queue = ['https://melolo.com/'];

    // Initial fetch from sitemap to seed
    const sitemap = await fetchURL('https://melolo.com/sitemap.xml');
    const links = sitemap.match(/https:\/\/melolo\.com\/dramas\/[a-z0-9-]+/g) || [];
    links.forEach(l => {
        const slug = l.split('/').pop();
        if (slug && l.split('/').length === 5) knownSlugs.add(slug);
    });

    console.log(`[Melolo] Seeded with ${knownSlugs.size} dramas.`);

    // Deep Discovery: Probe category pages
    const categories = ['Trending', 'Latest', 'Hot', 'Romance', 'CEO', 'Revenge'];
    for (const cat of categories) {
        const html = await fetchURL(`https://melolo.com/category/${cat.toLowerCase()}`);
        if (html) {
            const m = html.match(/\/dramas\/([a-z0-9-]+)/g) || [];
            m.forEach(l => knownSlugs.add(l.split('/').pop()));
        }
    }

    const data = Array.from(knownSlugs).map(s => ({
        platform_id: `melolo-${s}`,
        platform: 'melolo',
        title: s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        updated_at: new Date().toISOString()
    }));

    for (let i = 0; i < data.length; i += 500) {
        await upsertToSupabase(data.slice(i, i + 500));
    }
}

async function discoverDramaBox() {
    console.log('[DramaBox] Starting Sequential ID Discovery...');
    const startId = 42000000000;
    const endId = 42000010000;
    // This is just an example of range discovery if we had a way to verify IDs quickly
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await discoverMelolo();
    console.log('--- Deep Discovery Phase 1 Complete ---');
}
run();
