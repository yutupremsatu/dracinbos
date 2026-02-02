const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchDrama = (id) => {
    return new Promise((resolve) => {
        const url = `https://www.netshort.com/player?shortPlayId=${id}`;
        const options = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 };
        https.get(url, options, (res) => {
            if (res.statusCode !== 200) return resolve(null);
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                const nameMatch = d.match(/"shortPlayName":\s*"([^"]+)"/);
                const descMatch = d.match(/"shortDescription":\s*"([^"]+)"/);
                const coverMatch = d.match(/"shortPlayCover":\s*"([^"]+)"/);
                if (nameMatch) {
                    resolve({
                        platform_id: `netshort-${id}`,
                        platform: 'netshort',
                        title: nameMatch[1],
                        description: descMatch ? descMatch[1] : nameMatch[1],
                        cover_url: coverMatch ? coverMatch[1] : "",
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
    console.log('--- NetShort Exhaustive Sweep ---');
    const BATCH_SIZE = 50;
    for (let i = 1; i <= 2000; i += BATCH_SIZE) {
        process.stdout.write(`\rSweeping NetShort IDs ${i}-${i + BATCH_SIZE - 1}...`);
        const results = await Promise.all(
            Array.from({ length: BATCH_SIZE }, (_, j) => fetchDrama(i + j))
        );
        const valid = results.filter(r => r !== null);
        if (valid.length > 0) {
            console.log(`\n  Found ${valid.length} dramas in batch.`);
            await upsertToSupabase(valid);
        }
    }
    console.log('\n--- Sweep Complete ---');
}
run();
