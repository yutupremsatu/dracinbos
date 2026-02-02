const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const checkID = (platform, id) => {
    const url = platform === 'netshort'
        ? `https://www.netshort.com/player?shortPlayId=${id}`
        : `https://www.dramabox.com/video/${id}`;

    return new Promise((resolve) => {
        const options = { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 };
        const req = https.request(url, options, (res) => {
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
                'Content-Type': 'application/json'
            }
        }, (res) => {
            res.on('end', () => resolve(true));
        });
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function run() {
    console.log('--- ID Brute Probe ---');

    // NetShort IDs usually start around 1000? 
    // Let's probe a sample
    const nsStart = 1000;
    const nsEnd = 1500;

    const results = [];
    for (let id = nsStart; id < nsEnd; id++) {
        if (id % 50 === 0) console.log(`Probing NetShort ID: ${id}`);
        // For speed, let's just assume they exist if the user says 10k?
        // No, we should verify. 
        // Actually, let's try to fetch the page and extract the name.
    }
}
run();
