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
        req.on('error', () => resolve(false));
        req.write(JSON.stringify(data));
        req.end();
    });
};

const humanize = (slug) => slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('=== MASS RECURSIVE CRAWLER START ===');

    const discovered = new Set();
    const queue = [];

    // Seed from local file
    try {
        if (fs.existsSync('all-sitemap-slugs.json')) {
            const localData = JSON.parse(fs.readFileSync('all-sitemap-slugs.json', 'utf8'));
            const slugs = localData.melolo || [];
            slugs.forEach(slug => {
                discovered.add(slug);
                queue.push(`https://melolo.com/dramas/${slug}`);
            });
            console.log(`Seeded with ${queue.length} slugs from file.`);
        }
    } catch (e) { console.log('File seed failed.'); }

    if (queue.length === 0) {
        // Fallback seed
        const initialData = await fetchURL(`${SUPABASE_URL}/rest/v1/dramas?select=platform_id&platform=eq.melolo&limit=1000`);
        try {
            const dramas = JSON.parse(initialData);
            dramas.forEach(d => {
                const slug = d.platform_id.replace('melolo-', '');
                if (!discovered.has(slug)) {
                    discovered.add(slug);
                    queue.push(`https://melolo.com/dramas/${slug}`);
                }
            });
        } catch (e) { }
    }

    console.log(`Final Seed Size: ${queue.length}`);

    let crawls = 0;
    const CRAWL_LIMIT = 5000; // Aggressive crawl
    const CONCURRENCY = 15;

    while (queue.length > 0 && crawls < CRAWL_LIMIT) {
        const batch = queue.splice(0, CONCURRENCY);
        const results = await Promise.all(batch.map(async (url) => {
            crawls++;
            return { url, html: await fetchURL(url) };
        }));

        const items = [];
        for (const res of results) {
            if (!res.html) continue;

            const matches = res.html.matchAll(/\/dramas\/([a-z0-9-]+)/g);
            for (const m of matches) {
                const slug = m[1];
                if (!discovered.has(slug) && !slug.includes('/') && slug.length > 3) {
                    discovered.add(slug);
                    items.push({
                        platform_id: `melolo-${slug}`,
                        platform: 'melolo',
                        title: humanize(slug),
                        description: humanize(slug),
                        updated_at: new Date().toISOString()
                    });
                    queue.push(`https://melolo.com/dramas/${slug}`);
                }
            }
        }

        if (items.length > 0) {
            await upsertToSupabase(items);
        }

        if (crawls % 50 === 0) {
            process.stdout.write(`\r[Progress] Crawls: ${crawls}, Discovered: ${discovered.size}, Queue: ${queue.length}   `);
        }
    }

    console.log(`\n=== MASS RECURSIVE CRAWLER COMPLETE (Total: ${discovered.size}) ===`);
}
run();
