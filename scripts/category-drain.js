const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
    });
};

const upsertToSupabase = async (data) => {
    if (!data.length) return;
    console.log(`[Supabase] Syncing ${data.length} records...`);
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

async function syncPage(platform, url) {
    const html = await fetchURL(url);
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) return;
    try {
        const json = JSON.parse(match[1]);
        const dramas = [];
        const walk = (obj) => {
            if (obj && typeof obj === 'object') {
                const id = obj.book_id || obj.bookId || obj.id;
                const name = obj.book_title || obj.bookName || obj.name || obj.title;
                if (id && name && typeof name === 'string' && name.length > 2) dramas.push(obj);
                Object.keys(obj).forEach(k => walk(obj[k]));
            }
        };
        walk(json.props?.pageProps || {});
        const mapped = dramas.map(d => ({
            platform_id: `${platform}-${d.book_id || d.bookId || d.id}`,
            platform,
            title: d.book_title || d.bookName || d.name || d.title,
            description: d.introduction || d.description || d.abstract || "No description",
            cover_url: d.book_pic || d.coverH || d.cover || d.thumb_url,
            updated_at: new Date().toISOString()
        })).filter(d => !d.platform_id.includes('undefined'));
        if (mapped.length) await upsertToSupabase(mapped);
    } catch (e) { }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const rsCats = ['romance', 'revenge', 'boss', 'werewolf', 'scifi', 'horror'];
    for (const cat of rsCats) await syncPage('reelshort', `https://www.reelshort.com/category/${cat}`);

    const dbCats = ['romance', 'revenge', 'boss', 'action'];
    for (const cat of dbCats) await syncPage('dramabox', `https://www.dramabox.com/category/${cat}`);

    console.log('--- CATEGORY DRAIN COMPLETE ---');
}
run();
