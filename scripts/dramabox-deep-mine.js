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
        req.on('error', () => resolve(false));
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function probeRange(start, count) {
    console.log(`[Probe] Range ${start} to ${start + count}...`);
    const tasks = [];
    const hits = [];

    for (let i = 0; i < count; i++) {
        const id = start + i;
        const task = new Promise(async (resolve) => {
            const url = `https://wilandwillie.com/api/dramabox/detail?bookId=${id}`;
            const jsonStr = await fetchURL(url);
            try {
                const j = JSON.parse(jsonStr);
                if (j.data && j.data.bookName) {
                    process.stdout.write('+');
                    hits.push({
                        platform_id: `dramabox-${id}`,
                        platform: 'dramabox',
                        title: j.data.bookName,
                        description: j.data.introduction || j.data.bookName,
                        cover_url: j.data.coverH || j.data.coverW || "",
                        total_episodes: j.data.chapterCount || 0,
                        updated_at: new Date().toISOString()
                    });
                } else {
                    // process.stdout.write('.');
                }
            } catch (e) { }
            resolve();
        });
        tasks.push(task);

        // Batch size limit to avoid DDOSing ourselves
        if (tasks.length >= 50) {
            await Promise.all(tasks);
            tasks.length = 0;
            if (hits.length > 0) {
                await upsertToSupabase(hits);
                console.log(` [Saved ${hits.length}]`);
                hits.length = 0;
            }
        }
    }

    // Flush remaining
    if (tasks.length > 0) await Promise.all(tasks);
    if (hits.length > 0) await upsertToSupabase(hits);
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- DRAMABOX DEEP MINING START ---');

    // Based on findings: 42000004908 exists. 
    // Let's sweep a wide plausible range.
    // Start: 42000000000
    // End:   42000010000 (10k items)

    const BASE = 42000000000;
    const CHUNK = 10000;

    await probeRange(BASE, CHUNK);

    console.log('\n--- MINING COMPLETE ---');
}
run();
