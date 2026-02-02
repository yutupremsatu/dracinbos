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

const upsertBatch = async (data) => {
    if (!data.length) return 0;
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
            resolve(data.length);
        });
        req.on('error', () => resolve(0));
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- DramaBox Dedicated Drain ---');

    let total = 0;
    const MAX_PAGES = 1000;

    for (let p = 1; p <= MAX_PAGES; p++) {
        const url = `https://wilandwillie.com/api/dramabox/latest?page=${p}`;
        const jsonStr = await fetchURL(url);
        try {
            const json = JSON.parse(jsonStr);
            const list = json.data || [];

            if (list.length === 0) { console.log('End of list.'); break; }

            const batch = list.map(item => ({
                platform_id: `dramabox-${item.bookId}`,
                platform: 'dramabox',
                title: item.bookName,
                description: item.introduction || item.bookName,
                cover_url: item.coverH || item.coverW || "",
                updated_at: new Date().toISOString()
            })).filter(i => i.platform_id && i.title);

            if (batch.length > 0) {
                await upsertBatch(batch);
                total += batch.length;
                process.stdout.write(`\rPage ${p} | Synced: ${total}   `);
            }

        } catch (e) { }

        if (p % 20 === 0) await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n=== DRAMABOX DRAIN COMPLETE (Total: ${total}) ===`);
}
run();
