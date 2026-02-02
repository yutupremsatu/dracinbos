const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': '*/*'
            },
            timeout: 15000
        };
        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
        req.on('timeout', () => { req.destroy(); resolve(''); });
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
            res.on('data', () => { });
            res.on('end', () => resolve(true));
        });
        req.on('error', () => resolve(false));
        req.write(JSON.stringify(data));
        req.end();
    });
};

async function syncCatalog(platform, url) {
    console.log(`[Elite Sync] Probing ${platform}...`);
    const html = await fetchURL(url);
    if (!html) return;

    const dramas = new Map();

    // Pattern 1: JSON-LD
    const ldMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    for (const m of ldMatches) {
        try {
            const json = JSON.parse(m[1]);
            const items = Array.isArray(json.itemListElement) ? json.itemListElement : [json];
            items.forEach(it => {
                const item = it.item || it;
                const id = item['@id'] || item.url || item.identifier;
                const name = item.name || item.headline;
                if (id && name) dramas.set(String(id), { id, name, cover: item.image });
            });
        } catch (e) { }
    }

    // Pattern 2: NEXT_DATA
    const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (nextMatch) {
        try {
            const json = JSON.parse(nextMatch[1]);
            const walk = (obj) => {
                if (obj && typeof obj === 'object') {
                    const id = obj.book_id || obj.bookId || obj.id || obj.play_id || obj.shortPlayId;
                    const name = obj.book_title || obj.bookName || obj.name || obj.title || obj.shortPlayName;
                    if (id && name) dramas.set(String(id), { id, name, cover: obj.book_pic || obj.coverH || obj.cover || obj.thumb_url || obj.shortPlayCover });
                    Object.keys(obj).forEach(k => walk(obj[k]));
                }
            };
            walk(json.props?.pageProps || {});
        } catch (e) { }
    }

    // Pattern 3: Generic A-tags
    const aMatches = html.matchAll(/href="[^"]*?\/(drama|book|play|video)\/([a-z0-9-]+)"[^>]*?title="([^"]+)"/gi);
    for (const m of aMatches) {
        if (!dramas.has(m[2])) dramas.set(m[2], { id: m[2], name: m[3] });
    }

    if (dramas.size > 0) {
        const mapped = Array.from(dramas.values()).map(d => ({
            platform_id: `${platform}-${d.id}`,
            platform,
            title: d.name,
            description: d.name,
            cover_url: d.cover || "",
            updated_at: new Date().toISOString()
        })).filter(d => !d.platform_id.includes('undefined'));
        await upsertToSupabase(mapped);
    }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('=== TURBO ELITE SYNC START ===');

    const targets = [
        { p: 'dramabox', u: 'https://www.dramabox.com/' },
        { p: 'dramabox', u: 'https://www.dramabox.com/channel' },
        { p: 'reelshort', u: 'https://www.reelshort.com/' },
        { p: 'reelshort', u: 'https://www.reelshort.com/channel' },
        { p: 'reelshort', u: 'https://www.reelshort.com/hot' },
        { p: 'netshort', u: 'https://www.netshort.com/' },
        { p: 'melolo', u: 'https://melolo.com/' },
        { p: 'flickreels', u: 'https://flickreels.com/' },
        { p: 'shorttv', u: 'https://www.shorttv.id/' }
    ];

    for (const target of targets) {
        await syncCatalog(target.p, target.u);
    }

    console.log('=== TURBO ELITE SYNC COMPLETE ===');
}
run();
