const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
        }, (res) => {
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
        req.on('error', () => resolve(false));
        req.write(JSON.stringify(data));
        req.end();
    });
};

function deepCollect(obj, results) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        for (const item of obj) {
            // Pattern Match for ReelShort items
            const id = item.bookId || item.id || item.book_id;
            const title = item.title || item.bookName || item.book_name || item.name;
            const cover = item.cover || item.coverUrl || item.cover_url || item.thumb;

            // Validation: Must have ID, Title, and look like a drama
            // ReelShort IDs are usually UUIDs or long strings, titles are strings
            if (id && title && typeof title === 'string') {
                results.push({
                    platform_id: `reelshort-${id}`,
                    platform: 'reelshort',
                    title: title,
                    description: item.introduction || item.desc || title,
                    cover_url: cover || "",
                    total_episodes: item.chapterCount || item.total_chapter || 0,
                    updated_at: new Date().toISOString()
                });
            }
        }
    }

    for (const k in obj) {
        if (typeof obj[k] === 'object') deepCollect(obj[k], results);
    }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- REELSHORT JSON DRAIN START ---');

    console.log('Fetching Homepage...');
    const html = await fetchURL('https://www.reelshort.com/');

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) {
        console.log('__NEXT_DATA__ not found.');
        return;
    }

    console.log('Parsing JSON...');
    let json;
    try {
        json = JSON.parse(match[1]);
    } catch (e) {
        console.log('JSON Parse Error');
        return;
    }

    const candidates = [];
    deepCollect(json, candidates);

    // Deduplicate
    const unique = Array.from(new Map(candidates.map(c => [c.platform_id, c])).values());
    console.log(`Found ${unique.length} unique titles.`);

    // Upsert
    if (unique.length > 0) {
        // Filter out bad ones if any (e.g. valid IDs but no cover if strict check is needed, but we do that later)
        const valid = unique.filter(x => x.title.length > 1 && !x.title.includes('Test'));
        console.log(`Syncing ${valid.length} records to Supabase...`);

        const CHUNK_SIZE = 500;
        for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
            await upsertToSupabase(valid.slice(i, i + CHUNK_SIZE));
            process.stdout.write(`Batch ${i}-${Math.min(i + CHUNK_SIZE, valid.length)} done. `);
        }
    }

    console.log('\n--- REELSHORT DRAIN COMPLETE ---');
}
run();
