const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
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
            res.on('data', () => { });
            res.on('end', () => resolve(true));
        });
        req.on('error', () => resolve(false));
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const urls = ['https://www.dramabox.com/channel', 'https://www.reelshort.com/', 'https://www.netshort.com/'];

    for (const u of urls) {
        const h = await fetchURL(u);
        const platform = u.includes('reelshort') ? 'reelshort' : u.includes('dramabox') ? 'dramabox' : 'netshort';

        // Find ID / Name pairs more loosely
        // We look for objects like {"id":123,"name":"abc"} or similar
        const idMatches = [...h.matchAll(/"(id|book_id|bookId|shortPlayId)":(\d+|"[a-z0-9-]+")/g)];
        const nameMatches = [...h.matchAll(/"(title|name|bookName|shortPlayName)":"(.*?)"/g)];

        const upsertData = [];
        for (let i = 0; i < Math.min(idMatches.length, nameMatches.length); i++) {
            const id = idMatches[i][2].replace(/\"/g, '');
            const title = nameMatches[i][2];
            if (title.length > 2 && title.length < 100) {
                upsertData.push({
                    platform_id: `${platform}-${id}`,
                    platform: platform,
                    title: title,
                    description: title,
                    updated_at: new Date().toISOString()
                });
            }
        }

        if (upsertData.length > 0) {
            console.log(`Upserting ${upsertData.length} records for ${platform}`);
            await upsertToSupabase(upsertData);
        }
    }
}
run();
