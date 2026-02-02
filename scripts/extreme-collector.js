const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url, options = {}) => {
    return new Promise((resolve) => {
        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        };
        const req = https.get(url, { ...options, headers: { ...defaultHeaders, ...options.headers } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(null));
    });
};

const upsertToSupabase = async (data) => {
    if (!data.length) return;
    console.log(`[Supabase] Upserting ${data.length} records... Sample: ${data[0].platform_id}`);

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
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`[Supabase] Status: ${res.statusCode} ${res.statusMessage}`);
                if (res.statusCode >= 400) console.log("Error Body:", body);
                resolve(true);
            });
        });
        req.on('error', (e) => {
            console.error(`[Supabase Error] ${e.message}`);
            resolve(false);
        });
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function collectMelolo() {
    console.log("[Melolo] Scrape...");
    const pages = ['', '/category', '/category/romance', '/category/revenge'];
    const dramas = new Map();
    for (const p of pages) {
        const html = await fetchURL(`https://melolo.com${p}`);
        const regex = /href="https:\/\/melolo\.com\/dramas\/([a-z0-9-]+)" aria-label="(.*?)"/g;
        let m;
        while ((m = regex.exec(html)) !== null) dramas.set(m[1], { id: m[1], title: m[2] });
        const relRegex = /href="\/dramas\/([a-z0-9-]+)" aria-label="(.*?)"/g;
        while ((m = relRegex.exec(html)) !== null) dramas.set(m[1], { id: m[1], title: m[2] });
    }
    const upsertData = Array.from(dramas.values()).map(d => ({
        platform_id: `melolo-${d.id}`,
        platform: 'melolo',
        title: d.title,
        description: d.title,
        cover_url: "",
        category: "General",
        updated_at: new Date().toISOString()
    }));
    await upsertToSupabase(upsertData);
}

async function collectNetShort() {
    console.log("[NetShort] Scrape...");
    const html = await fetchURL('https://www.netshort.com/');
    const ids = (html.match(/"shortPlayId":(\d+)/g) || []).map(m => m.split(':')[1]);
    const names = (html.match(/"shortPlayName":"(.*?)"/g) || []).map(m => m.split('":"')[1].replace('"', ''));
    const dramas = [];
    for (let i = 0; i < Math.min(ids.length, names.length); i++) {
        dramas.push({ platform_id: `netshort-${ids[i]}`, platform: 'netshort', title: names[i], description: names[i], cover_url: "", category: "General", updated_at: new Date().toISOString() });
    }
    await upsertToSupabase(dramas);
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await collectMelolo();
    await collectNetShort();
}

run();
