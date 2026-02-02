const https = require('https');

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

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- DramaBox Mega Drain (Target: 10,000+) ---');

    let totalFound = 0;
    const START_PAGE = 1;
    const END_PAGE = 1000;

    for (let p = START_PAGE; p <= END_PAGE; p++) {
        process.stdout.write(`\r[DramaBox] Draining Page ${p}/${END_PAGE}... `);
        const url = `https://wilandwillie.com/api/dramabox/latest?page=${p}`;
        const jsonStr = await fetchURL(url);
        if (!jsonStr) continue;

        try {
            const result = JSON.parse(jsonStr);
            const list = result.data || [];
            if (Array.isArray(list) && list.length > 0) {
                const mapped = [];
                for (const item of list) {
                    const id = item.bookId;
                    if (!id) continue;

                    // Optional: Deep quality check (Poster)
                    // const hasPoster = await checkPoster(item.coverH);
                    // if (!hasPoster) continue;

                    mapped.push({
                        platform_id: `dramabox-${id}`,
                        platform: 'dramabox',
                        title: item.bookName,
                        description: item.introduction || "",
                        cover_url: item.coverH || item.thumb_url || "",
                        updated_at: new Date().toISOString()
                    });
                }

                if (mapped.length > 0) {
                    await upsertToSupabase(mapped);
                    totalFound += mapped.length;
                    process.stdout.write(`Found: ${totalFound} titles   `);
                }
            } else if (p > 10) {
                console.log('\nEnd of data reached.');
                break;
            }
        } catch (e) { }

        // Anti-throttle delay
        if (p % 10 === 0) await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n=== MEGA DRAIN COMPLETE (Total: ${totalFound}) ===`);
}
run();
