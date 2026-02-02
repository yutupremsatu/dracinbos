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

const checkPoster = (url) => {
    if (!url || !url.startsWith('http')) return Promise.resolve(false);
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
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

async function sweep(platform) {
    console.log(`--- Alpha Sweep: ${platform} ---`);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
    let totalPerPlatform = 0;

    for (const char of alphabet) {
        process.stdout.write(`\r[${platform}] Searching: ${char}... `);
        const url = `https://api.sansekai.my.id/api/${platform}/search?keyword=${char}`;
        const jsonStr = await fetchURL(url);
        if (!jsonStr) continue;

        try {
            const result = JSON.parse(jsonStr);
            const list = result.data?.books || result.data?.list || result.data || [];
            if (Array.isArray(list)) {
                const mapped = [];
                for (const item of list) {
                    const id = item.book_id || item.id || item.play_id || item.shortPlayId;
                    if (!id) continue;

                    const drama = {
                        platform_id: `${platform}-${id}`,
                        platform: platform,
                        title: item.book_name || item.title || item.name || item.shortPlayName,
                        description: item.abstract || item.description || item.introduction || "No description",
                        cover_url: item.thumb_url || item.cover || item.cover_url || item.shortPlayCover,
                        updated_at: new Date().toISOString()
                    };

                    if (drama.title && !drama.platform_id.includes('undefined')) {
                        // Quality Gate: Fast Poster Check
                        // In a real sweep, we might skip HEAD for speed and do it later
                        mapped.push(drama);
                    }
                }

                if (mapped.length > 0) {
                    await upsertToSupabase(mapped);
                    totalPerPlatform += mapped.length;
                }
            }
        } catch (e) { }
    }
    console.log(`\n[${platform}] Total titles found: ${totalPerPlatform}`);
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const platforms = [
        'melolo', 'reelshort', 'dramabox', 'netshort', 'flickreels',
        'freereels', 'goodshort', 'moboreels', 'topshort', 'playlet',
        'shotv', 'flexitv', 'anidrama', 'stardust'
    ];

    for (const p of platforms) {
        await sweep(p);
    }
    console.log('=== MASTER ALPHA SWEEP COMPLETE ===');
}
run();
