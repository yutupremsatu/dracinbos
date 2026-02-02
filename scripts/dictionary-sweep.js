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

async function sweep(platform) {
    console.log(`--- Dictionary Sweep: ${platform} ---`);
    const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const combinations = [];
    for (let i = 0; i < chars.length; i++) {
        for (let j = 0; j < chars.length; j++) {
            combinations.push(chars[i] + chars[j]);
        }
    }

    let totalFound = 0;
    const seen = new Set();

    for (const k of combinations) {
        process.stdout.write(`\r[${platform}] Searching: ${k}... `);
        const url = `https://api.sansekai.my.id/api/${platform}/search?keyword=${k}`;
        const jsonStr = await fetchURL(url);
        if (!jsonStr) continue;

        try {
            const result = JSON.parse(jsonStr);
            const list = result.data?.books || result.data?.list || result.data || [];
            if (Array.isArray(list)) {
                const mapped = [];
                for (const item of list) {
                    const id = item.book_id || item.id || item.play_id;
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
                    totalFound += mapped.length;
                    process.stdout.write(`Found: ${totalFound} titles   `);
                }
            }
        } catch (e) { }

        // Speed control: Stop if platform is exhausted or hits limit
        if (totalFound > 2000) break;
    }
    console.log(`\n[${platform}] Sweep Finished. Total Unique: ${totalFound}`);
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const platforms = ['melolo', 'reelshort', 'dramabox', 'netshort', 'flickreels', 'goodshort', 'moboreels', 'topshort', 'playlet', 'flexitv'];
    for (const p of platforms) {
        await sweep(p);
    }
}
run();
