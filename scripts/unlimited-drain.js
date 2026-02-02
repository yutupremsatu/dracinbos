const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 20000,
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
        req.write(JSON.stringify(data));
        req.end();
    });
};

const humanize = (slug) => slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('=== UNLIMITED LINK DRAIN START ===');

    // 1. ShortTV (Major Target)
    console.log('[ShortTV] Fetching sitemap...');
    const stvData = await fetchURL('https://www.shorttv.id/sitemap.xml');
    if (stvData) {
        const links = stvData.match(/https:\/\/www\.shorttv\.id\/drama\/\d+/g) || [];
        const unique = [...new Set(links)];
        console.log(`[ShortTV] Found ${unique.length} unique links.`);
        const data = unique.map(l => {
            const id = l.split('/').pop();
            return { platform_id: `shorttv-${id}`, platform: 'shorttv', title: `ShortTV Drama ${id}`, description: `Drama ${id}`, updated_at: new Date().toISOString() };
        });
        for (let i = 0; i < data.length; i += 500) await upsertToSupabase(data.slice(i, i + 500));
    }

    // 2. GoodShort (If available)
    console.log('[GoodShort] Probing...');
    const gsData = await fetchURL('https://www.goodshort.com/sitemap.xml');
    if (gsData) {
        const links = gsData.match(/https:\/\/www\.goodshort\.com\/video\/[a-z0-9-]+/g) || [];
        const unique = [...new Set(links)];
        console.log(`[GoodShort] Found ${unique.length} links.`);
        const data = unique.map(l => {
            const slug = l.split('/').pop();
            return { platform_id: `goodshort-${slug}`, platform: 'goodshort', title: humanize(slug), description: humanize(slug), updated_at: new Date().toISOString() };
        });
        for (let i = 0; i < data.length; i += 500) await upsertToSupabase(data.slice(i, i + 500));
    }

    console.log('=== UNLIMITED LINK DRAIN COMPLETE ===');
}
run();
