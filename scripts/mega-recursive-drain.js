const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
            timeout: 15000,
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
    console.log('=== MEGA RECURSIVE DRAIN START ===');

    const discovered = new Set();
    const queue = [
        'https://melolo.com/',
        'https://www.reelshort.com/channel',
        'https://www.dramabox.com/channel',
        'https://www.netshort.com/'
    ];

    const visited = new Set();
    const dramaData = [];

    let crawls = 0;
    const CRAWL_LIMIT = 500; // Large but safe for one run

    while (queue.length > 0 && crawls < CRAWL_LIMIT) {
        const url = queue.shift();
        if (visited.has(url)) continue;
        visited.add(url);
        crawls++;

        const html = await fetchURL(url);
        if (!html) continue;

        // 1. Extract and Add to Supabase Data
        const items = [];

        // Melolo Pattern
        const meloloMatches = html.matchAll(/\/dramas\/([a-z0-9-]+)(\/[a-z0-9-]+)?/g);
        for (const m of meloloMatches) {
            const slug = m[1];
            if (m[0].split('/').length === 3 && !discovered.has(`melolo-${slug}`)) {
                discovered.add(`melolo-${slug}`);
                items.push({ platform_id: `melolo-${slug}`, platform: 'melolo', title: humanize(slug), description: humanize(slug) });
                queue.push(`https://melolo.com/dramas/${slug}`);
            }
        }

        // ReelShort Pattern
        const rsMatches = html.matchAll(/\/book\/(\d+)/g);
        for (const m of rsMatches) {
            const id = m[1];
            if (!discovered.has(`reelshort-${id}`)) {
                discovered.add(`reelshort-${id}`);
                items.push({ platform_id: `reelshort-${id}`, platform: 'reelshort', title: `ReelShort ${id}`, description: `Drama ID ${id}` });
                queue.push(`https://www.reelshort.com/book/${id}`);
            }
        }

        // DramaBox Pattern
        const dbMatches = html.matchAll(/\/video\/(\d+)/g);
        for (const m of dbMatches) {
            const id = m[1];
            if (!discovered.has(`dramabox-${id}`)) {
                discovered.add(`dramabox-${id}`);
                items.push({ platform_id: `dramabox-${id}`, platform: 'dramabox', title: `DramaBox ${id}`, description: `Drama ID ${id}` });
                queue.push(`https://www.dramabox.com/video/${id}`);
            }
        }

        // NetShort Pattern
        const nsMatches = html.matchAll(/"shortPlayId":(\d+)/g);
        for (const m of nsMatches) {
            const id = m[1];
            if (!discovered.has(`netshort-${id}`)) {
                discovered.add(`netshort-${id}`);
                items.push({ platform_id: `netshort-${id}`, platform: 'netshort', title: `NetShort ${id}`, description: `Drama ID ${id}` });
            }
        }

        if (items.length > 0) {
            const filtered = items.map(it => ({ ...it, updated_at: new Date().toISOString() }));
            await upsertToSupabase(filtered);
        }

        if (crawls % 50 === 0) console.log(`[Progress] Crawls: ${crawls}, Discovered: ${discovered.size}`);
    }

    console.log(`=== MEGA RECURSIVE DRAIN COMPLETE (Found ${discovered.size}) ===`);
}
run();
