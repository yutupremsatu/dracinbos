const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const checkPlatform = (platform) => {
    return new Promise((resolve) => {
        const url = `${SUPABASE_URL}/rest/v1/dramas?platform=eq.${platform}&select=count`;
        const req = https.get(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'count=exact'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const range = res.headers['content-range'];
                let count = 0;
                if (range) {
                    count = range.split('/')[1];
                }
                resolve({ platform, count });
            });
        });
        req.on('error', () => resolve({ platform, count: 'Error' }));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- DATABASE STATUS ---');
    const platforms = ['melolo', 'reelshort', 'dramabox', 'netshort', 'flickreels'];

    for (const p of platforms) {
        const res = await checkPlatform(p);
        console.log(`${res.platform.padEnd(12)} : ${res.count}`);
    }
}
run();
