const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, rejectUnauthorized: false }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- NetShort Homepage JSON Drain ---');

    const html = await fetchURL('https://www.netshort.com');
    if (!html) { console.log('Failed to fetch homepage'); return; }

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) { console.log('No NEXT_DATA found'); return; }

    try {
        const json = JSON.parse(match[1]);
        const items = [];

        // Walk the JSON for anything looking like a drama
        const walk = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.shortPlayId && obj.shortPlayName) {
                items.push({
                    platform_id: `netshort-${obj.shortPlayId}`,
                    platform: 'netshort',
                    title: obj.shortPlayName,
                    description: obj.introduction || obj.shortPlayName,
                    cover_url: obj.book_pic || obj.shortPlayCover || "",
                    updated_at: new Date().toISOString()
                });
            }
            Object.values(obj).forEach(walk);
        };

        walk(json.props || {});

        const unique = Array.from(new Map(items.map(i => [i.platform_id, i])).values());
        console.log(`Found ${unique.length} Unique NetShort Titles.`);

        if (unique.length > 0) {
            // Upsert
            await new Promise((resolve) => {
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
                    resolve();
                });
                req.write(JSON.stringify(unique));
                req.end();
            });
            console.log('Sync Complete.');
        }

    } catch (e) {
        console.log('JSON Parse Failed:', e.message);
    }
}
run();
