const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchSupabase = (path, method = 'GET', body = null) => {
    return new Promise((resolve) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
        const req = https.request(url, {
            method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data ? JSON.parse(data) : null));
        });
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const checkPoster = (url) => {
    if (!url || !url.startsWith('http')) return Promise.resolve(false);
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
    });
};

async function run() {
    console.log('--- Database Screening Started ---');
    const dramas = await fetchSupabase('dramas?select=platform_id,title,cover_url,platform');
    console.log(`Auditing ${dramas.length} records...`);

    const broken = [];
    for (const d of dramas) {
        process.stdout.write(`\rChecking: ${d.title.substring(0, 30)}...`);
        const isPosterValid = await checkPoster(d.cover_url);

        if (!isPosterValid) {
            broken.push({ id: d.platform_id, reason: 'missing_poster' });
        }
    }

    console.log(`\nScreening Complete. Found ${broken.length} broken records.`);
    fs.writeFileSync('screening-results.json', JSON.stringify(broken, null, 2));

    // Optionally: Update Supabase to mark them (need a column for it, or just delete)
    // For now, let's just log them.
}

run();
