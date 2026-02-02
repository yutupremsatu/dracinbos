const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' },
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

async function sweepPlatform(platform, apiPath) {
    console.log(`[Sweep] Platform: ${platform}`);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
    const discovered = new Set();

    for (const char of alphabet) {
        console.log(`  Searching keyword: ${char}`);
        const url = `https://api.sansekai.my.id/api/${apiPath}/search?keyword=${char}`;
        const jsonStr = await fetchURL(url);
        if (!jsonStr) continue;

        try {
            const result = JSON.parse(jsonStr);
            const list = result.data?.books || result.data?.list || result.data || [];
            if (Array.isArray(list)) {
                const mapped = list.map(item => ({
                    platform_id: `${platform}-${item.book_id || item.id || item.play_id}`,
                    platform: platform,
                    title: item.book_name || item.title || item.name,
                    description: item.abstract || item.description || item.introduction || "No description",
                    cover_url: item.thumb_url || item.cover || item.cover_url,
                    updated_at: new Date().toISOString()
                })).filter(it => it.title && !it.platform_id.includes('undefined'));

                if (mapped.length > 0) {
                    await upsertToSupabase(mapped);
                }
            }
        } catch (e) { }
    }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await sweepPlatform('melolo', 'melolo');
    await sweepPlatform('reelshort', 'reelshort');
    await sweepPlatform('dramabox', 'dramabox');
    console.log('=== KEYWORD SWEEPER COMPLETE ===');
}
run();
