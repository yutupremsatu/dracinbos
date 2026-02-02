const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const keywords = [
    'love', 'boss', 'married', 'billionaire', 'contract', 'president', 'secret', 'revenge',
    'husband', 'wife', 'baby', 'divorce', 'family', 'heart', 'queen', 'king', 'crown',
    'ceo', 'hidden', 'mistaken', 'identity', 'game', 'summer', 'winter', 'forever',
    'dream', 'night', 'star', 'moon', 'sun', 'fire', 'ice', 'cold', 'warm', 'kiss',
    'destiny', 'fate', 'soul', 'breath', 'shadow', 'light', 'dark', 'edge', 'broken',
    'perfect', 'sweet', 'bitter', 'wild', 'dangerous', 'loyal', 'trapped', 'escape',
    'beyond', 'within', 'always', 'never', 'again', 'first', 'last', 'only', 'one',
    'two', 'three', 'thousand', 'million', 'gold', 'diamond', 'silver', 'rose',
    'flower', 'garden', 'mountain', 'sea', 'ocean', 'sky', 'blue', 'red', 'white',
    'black', 'mystery', 'truth', 'lie', 'trust', 'betrayal', 'hope', 'fear', 'brave',
    'pride', 'prejudice', 'sense', 'sensibility', 'persuasion', 'emma', 'north', 'south'
];

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, { rejectUnauthorized: false }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
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

async function blitz(platform) {
    console.log(`--- Keyword Blitz: ${platform} ---`);
    const seen = new Set();

    for (const k of keywords) {
        process.stdout.write(`\r[${platform}] Keyword: ${k}...`);
        const url = `https://api.sansekai.my.id/api/${platform}/search?keyword=${k}`;
        const jsonStr = await fetchURL(url);
        if (!jsonStr) continue;

        try {
            const result = JSON.parse(jsonStr);
            const list = result.data?.books || result.data?.list || result.data || [];
            if (Array.isArray(list)) {
                const mapped = list.map(item => {
                    const id = item.book_id || item.id || item.play_id || item.shortPlayId;
                    if (!id) return null;
                    if (seen.has(id)) return null;
                    seen.add(id);

                    return {
                        platform_id: `${platform}-${id}`,
                        platform: platform,
                        title: item.book_name || item.title || item.name || item.shortPlayName,
                        description: item.abstract || item.description || item.introduction || "No description",
                        cover_url: item.thumb_url || item.cover || item.cover_url || item.shortPlayCover,
                        updated_at: new Date().toISOString()
                    };
                }).filter(it => it !== null && it.title && !it.platform_id.includes('undefined'));

                if (mapped.length > 0) {
                    await upsertToSupabase(mapped);
                }
            }
        } catch (e) { }
    }
    console.log(`\n[${platform}] Total Unique Found: ${seen.size}`);
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const platforms = ['melolo', 'reelshort', 'dramabox', 'netshort', 'flickreels', 'freereels'];
    for (const p of platforms) {
        await blitz(p);
    }
    console.log('=== KEYWORD BLITZ COMPLETE ===');
}
run();
