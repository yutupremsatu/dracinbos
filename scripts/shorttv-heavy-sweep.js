const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchShortTV = (id) => {
    return new Promise((resolve) => {
        const url = `https://www.shorttv.id/drama/${id}`;
        const options = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 };
        https.get(url, options, (res) => {
            if (res.statusCode !== 200) return resolve(null);
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                const nameMatch = d.match(/<title>([^<]+)<\/title>/);
                if (nameMatch && !nameMatch[1].includes('404')) {
                    resolve({
                        platform_id: `shorttv-${id}`,
                        platform: 'shorttv',
                        title: nameMatch[1].replace(' - ShortTV', ''),
                        description: `ShortTV Drama ${id}`,
                        updated_at: new Date().toISOString()
                    });
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
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
    console.log('--- ShortTV Heavy Sweep ---');
    const BATCH_SIZE = 50;
    for (let i = 1; i <= 10000; i += BATCH_SIZE) {
        process.stdout.write(`\rSweeping ShortTV IDs ${i}-${i + BATCH_SIZE - 1}...`);
        const results = await Promise.all(
            Array.from({ length: BATCH_SIZE }, (_, j) => fetchShortTV(i + j))
        );
        const valid = results.filter(r => r !== null);
        if (valid.length > 0) {
            console.log(`\n  Found ${valid.length} dramas in batch.`);
            await upsertToSupabase(valid);
        }
    }
}
run();
