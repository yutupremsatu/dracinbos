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
    console.log('--- FINAL SURGICAL PUSH ---');

    // NetShort
    const nsHtml = await fetchURL('https://www.netshort.com/');
    const nsIds = (nsHtml.match(/"shortPlayId":(\d+)/g) || []).map(m => m.split(':')[1]);
    const nsData = nsIds.map(id => ({ platform_id: `netshort-${id}`, platform: 'netshort', title: `NetShort ${id}`, description: `Drama ${id}` }));
    await upsertToSupabase(nsData);

    // DramaBox Deep Walk
    const dbHtml = await fetchURL('https://www.dramabox.com/channel');
    const match = dbHtml.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (match) {
        const json = JSON.parse(match[1]);
        const dramas = [];
        const walk = (obj) => {
            if (obj && typeof obj === 'object') {
                if (obj.bookId || obj.id || obj.name) dramas.push(obj);
                Object.keys(obj).forEach(k => walk(obj[k]));
            }
        };
        walk(json.props?.pageProps || {});
        const dbData = dramas.map(d => ({
            platform_id: `dramabox-${d.bookId || d.id || d.book_id}`,
            platform: 'dramabox',
            title: d.bookName || d.name || d.title,
            description: d.introduction || d.description || `Drama ${d.bookId || d.id}`
        })).filter(d => d.title && !d.platform_id.includes('undefined'));
        await upsertToSupabase(dbData);
    }

    console.log('--- SURGICAL PUSH COMPLETE ---');
}
run();
