const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

async function sweepPlatform(platform) {
    console.log(`[Sweep] Starting ${platform}...`);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const combos = [];
    for (let a of alphabet) {
        for (let b of alphabet) combos.push(a + b);
    }

    let platformTotal = 0;
    const seen = new Set();

    for (let k of combos) {
        const url = `https://api.sansekai.my.id/api/${platform}/search?keyword=${k}`;
        const data = await fetchURL(url);
        try {
            const res = JSON.parse(data);
            const list = res.data?.books || res.data?.list || res.data || [];
            if (Array.isArray(list)) {
                const mapped = [];
                for (let item of list) {
                    const id = item.book_id || item.id || item.play_id || item.shortPlayId;
                    if (id && !seen.has(id)) {
                        seen.add(id);
                        mapped.push({
                            platform_id: `${platform}-${id}`,
                            platform: platform,
                            title: item.book_name || item.title || item.name,
                            description: item.abstract || item.description || "No description",
                            cover_url: item.thumb_url || item.cover || "",
                            updated_at: new Date().toISOString()
                        });
                    }
                }
                if (mapped.length > 0) {
                    await upsertToSupabase(mapped);
                    platformTotal += mapped.length;
                    process.stdout.write(`\r[${platform}] Progress: ${k} (Total: ${platformTotal})   `);
                }
            }
        } catch (e) { }

        if (platformTotal > 1500) break; // Capping to avoid getting blocked
    }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const platforms = [
        'melolo', 'reelshort', 'dramabox', 'netshort', 'flickreels',
        'freereels', 'goodshort', 'moboreels', 'topshort', 'playlet',
        'shotv', 'flexitv', 'anidrama', 'stardust'
    ];

    for (let p of platforms) {
        await sweepPlatform(p);
    }
}
run();
