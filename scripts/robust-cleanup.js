const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const deleteBatch = (ids) => {
    return new Promise((resolve) => {
        // PostgREST in syntax: col=in.(val1,val2)
        const url = `${SUPABASE_URL}/rest/v1/dramas?platform_id=in.(${ids.join(',')})`;
        const req = https.request(url, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }, (res) => {
            console.log(`[Cleanup] Batch status: ${res.statusCode}`);
            res.on('data', () => { });
            res.on('end', () => resolve());
        });
        req.on('error', (e) => {
            console.error(`[Cleanup] Error: ${e.message}`);
            resolve();
        });
        req.end();
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
        const results = JSON.parse(fs.readFileSync('screening-results.json', 'utf8'));
        const ids = results.map(r => r.id);
        console.log(`Starting cleanup of ${ids.length} records...`);

        for (let i = 0; i < ids.length; i += 50) {
            const batch = ids.slice(i, i + 50);
            await deleteBatch(batch);
            console.log(`[Cleanup] Deleted ${i + batch.length}/${ids.length}`);
            await new Promise(r => setTimeout(r, 200));
        }
        console.log('Cleanup complete.');
    } catch (e) {
        console.error('Cleanup failed:', e.message);
    }
}
run();
