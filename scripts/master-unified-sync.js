const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
            timeout: 10000,
            rejectUnauthorized: false
        };
        const req = https.get(url, options, (res) => {
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
            res.on('end', () => resolve(true));
        });
        req.write(JSON.stringify(data));
        req.end();
    });
};

const keywords = ['love', 'ceo', 'boss', 'married', 'billionaire', 'revenge', 'secret', 'destiny', 'heart', 'soul'];

async function deepWalk(obj, platform, results) {
    if (!obj || typeof obj !== 'object') return;

    // Pattern Match
    const id = obj.book_id || obj.bookId || obj.id || obj.play_id || obj.shortPlayId;
    const name = obj.book_name || obj.bookName || obj.title || obj.name || obj.shortPlayName;
    const cover = obj.book_pic || obj.coverH || obj.cover || obj.thumb_url || obj.shortPlayCover;

    if (id && name) {
        results.push({
            platform_id: `${platform}-${id}`,
            platform: platform,
            title: name,
            description: obj.abstract || obj.introduction || obj.description || name,
            cover_url: cover || "",
            updated_at: new Date().toISOString()
        });
    }

    for (const k in obj) {
        if (typeof obj[k] === 'object') await deepWalk(obj[k], platform, results);
    }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const targets = [
        { p: 'melolo', url: 'https://melolo.com' },
        { p: 'reelshort', url: 'https://www.reelshort.com' },
        { p: 'dramabox', url: 'https://www.dramabox.com' },
        { p: 'netshort', url: 'https://www.netshort.com' },
        { p: 'flickreels', url: 'https://www.flickreels.com' },
        { p: 'goodshort', url: 'https://www.goodshort.com' }
    ];

    console.log('--- Master Unified Sync 10K ---');

    for (const t of targets) {
        console.log(`[Sync] Probing ${t.p}...`);
        const html = await fetchURL(t.url);
        if (!html) continue;

        const results = [];

        // 1. NEXT_DATA
        const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (nextMatch) {
            try {
                const json = JSON.parse(nextMatch[1]);
                await deepWalk(json.props?.pageProps || {}, t.p, results);
            } catch (e) { }
        }

        // 2. Keyword Search (A-Z fallback)
        const char = 'a'; // Sample
        const apiSearch = `https://api.sansekai.my.id/api/${t.p}/search?keyword=${char}`;
        const searchJson = await fetchURL(apiSearch);
        try {
            const sj = JSON.parse(searchJson);
            const list = sj.data?.books || sj.data?.list || sj.data || [];
            if (Array.isArray(list)) {
                list.forEach(item => {
                    const id = item.book_id || item.id || item.play_id;
                    if (id) results.push({
                        platform_id: `${t.p}-${id}`,
                        platform: t.p,
                        title: item.book_name || item.title || item.name,
                        description: item.abstract || item.description || "No description",
                        cover_url: item.thumb_url || item.cover || "",
                        updated_at: new Date().toISOString()
                    });
                });
            }
        } catch (e) { }

        if (results.length > 0) {
            const unique = Array.from(new Map(results.map(r => [r.platform_id, r])).values());
            await upsertToSupabase(unique);
            console.log(`  -> Found ${unique.length} titles for ${t.p}`);
        }
    }
}
run();
