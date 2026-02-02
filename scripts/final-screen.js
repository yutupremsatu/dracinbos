const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const deleteRecord = (id) => {
    return new Promise((resolve) => {
        const url = `${SUPABASE_URL}/rest/v1/dramas?platform_id=eq.${id}`;
        const req = https.request(url, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }, (res) => {
            resolve(res.statusCode);
        });
        req.on('error', () => resolve(500));
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
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- FINAL PRE-DEPLOYMENT SCREENING ---');

    // Fetch ALL records for audit
    const res = await new Promise(resolve => {
        https.get(`${SUPABASE_URL}/rest/v1/dramas?select=platform_id,title,cover_url`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        }, r => {
            let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(d));
        });
    });

    const dramas = JSON.parse(res);
    console.log(`Auditing ${dramas.length} records...`);

    let removed = 0;
    for (const d of dramas) {
        let isBad = false;
        if (!d.cover_url || d.cover_url.length < 10) isBad = true;
        // if (!isBad) {
        //     // Optional: Deep check (slow)
        //     // const ok = await checkPoster(d.cover_url);
        //     // if (!ok) isBad = true;
        // }

        if (isBad) {
            await deleteRecord(d.platform_id);
            removed++;
            process.stdout.write(`\r[Deleted] ID: ${d.platform_id} (Missing Poster)   `);
        }
    }

    console.log(`\nScreening Complete. Removed ${removed} invalid records.`);
}
run();
