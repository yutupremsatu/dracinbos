const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
    });
};

const upsertToSupabase = async (data) => {
    if (!data.length) return;
    console.log(`[Supabase] Upserting ${data.length} records...`);
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

const humanize = (slug) => slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

async function syncMelolo() {
    console.log('[Sync] Melolo Sitemaps...');
    const sitemap = await fetchURL('https://melolo.com/sitemap.xml');
    const links = sitemap.match(/https:\/\/melolo\.com\/dramas\/[a-z0-9-]+/g) || [];
    const slugs = [...new Set(links.map(l => l.split('/').pop()))];
    const data = slugs.map(s => ({
        platform_id: `melolo-${s}`, platform: 'melolo', title: humanize(s), description: humanize(s), updated_at: new Date().toISOString()
    }));
    for (let i = 0; i < data.length; i += 500) await upsertToSupabase(data.slice(i, i + 500));
}

async function syncDramaBox() {
    console.log('[Sync] DramaBox NEXT_DATA...');
    const html = await fetchURL('https://www.dramabox.com/channel');
    const match = html.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (match) {
        try {
            const json = JSON.parse(match[1]);
            const dramas = [];
            const walk = (obj) => {
                if (obj && typeof obj === 'object') {
                    if (obj.bookName || obj.name) dramas.push(obj);
                    Object.keys(obj).forEach(k => walk(obj[k]));
                }
            };
            walk(json.props?.pageProps || {});
            const upsertData = dramas.map(d => ({
                platform_id: `dramabox-${d.bookId || d.id || d.book_id}`,
                platform: 'dramabox',
                title: d.bookName || d.name || d.title,
                description: d.introduction || d.description || "No description",
                cover_url: d.coverH || d.coverWap || d.cover || d.thumb_url,
                category: d.categoryName || "General",
                updated_at: new Date().toISOString()
            })).filter(d => d.title && d.platform_id !== 'dramabox-undefined');
            await upsertToSupabase(upsertData);
        } catch (e) { console.error('DramaBox Parse Error:', e.message); }
    }
}

async function syncReelShort() {
    console.log('[Sync] ReelShort NEXT_DATA...');
    const urls = ['https://www.reelshort.com/', 'https://www.reelshort.com/hot'];
    for (const url of urls) {
        const html = await fetchURL(url);
        const match = html.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
        if (match) {
            try {
                const json = JSON.parse(match[1]);
                const fallback = json.props?.pageProps?.fallback || {};
                const dramas = [];
                Object.values(fallback).forEach(val => {
                    if (val?.data?.lists) val.data.lists.forEach(l => { if (l.books) dramas.push(...l.books); });
                });
                const upsertData = dramas.map(d => ({
                    platform_id: `reelshort-${d.book_id}`,
                    platform: 'reelshort',
                    title: d.book_title || d.book_name,
                    description: d.introduction || d.book_desc || "No description",
                    cover_url: d.book_pic || d.cover_url,
                    category: "General",
                    updated_at: new Date().toISOString()
                })).filter(d => d.title && d.platform_id !== 'reelshort-undefined');
                await upsertToSupabase(upsertData);
            } catch (e) { }
        }
    }
}

async function syncNetShort() {
    console.log('[Sync] NetShort Regex...');
    const html = await fetchURL('https://www.netshort.com/');
    const idMatches = html.matchAll(/"shortPlayId":(\d+)/g);
    const idSet = [...new Set([...idMatches].map(m => m[1]))];
    const data = idSet.map(id => ({
        platform_id: `netshort-${id}`, platform: 'netshort', title: `NetShort Drama ${id}`, description: `Drama ID: ${id}`, updated_at: new Date().toISOString()
    }));
    await upsertToSupabase(data);
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('=== ELITE SYNC START ===');
    await syncMelolo();
    await syncDramaBox();
    await syncReelShort();
    await syncNetShort();
    console.log('=== ELITE SYNC COMPLETE ===');
}
run();
