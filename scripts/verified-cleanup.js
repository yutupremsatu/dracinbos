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

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
        const results = JSON.parse(fs.readFileSync('screening-results.json', 'utf8'));
        console.log(`Auditing and Cleaning ${results.length} broken records...`);

        let deleted = 0;
        for (const r of results) {
            const status = await deleteRecord(r.id);
            if (status === 204 || status === 404) deleted++;
            if (deleted % 50 === 0) process.stdout.write(`\rDeleted: ${deleted}/${results.length}`);
        }
        console.log(`\nCleanup complete. Total removed: ${deleted}`);
    } catch (e) {
        console.error('Cleanup failed:', e.message);
    }
}
run();
