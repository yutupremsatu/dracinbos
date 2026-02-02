const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- Melolo Recursive Recommendation Crawler ---');

    // Seed with current 906 slugs
    let seeds = [];
    if (fs.existsSync('all-sitemap-slugs.json')) {
        const data = JSON.parse(fs.readFileSync('all-sitemap-slugs.json', 'utf8'));
        seeds = data.melolo || [];
    }

    const seen = new Set(seeds);
    const queue = [...seeds];
    console.log(`Seeded with ${queue.length} slugs.`);

    let discovered = queue.length;
    let counts = 0;

    while (queue.length > 0 && counts < 2000) {
        const slug = queue.shift();
        counts++;

        process.stdout.write(`\r[Melolo] Crawling: ${slug} (${counts}/${discovered})... `);

        // Melolo IDs in API are often used instead of slugs. 
        // We need to fetch the page to find the numeric ID first (meta tags usually have it)
        const html = await fetchURL(`https://melolo.com/dramas/${slug}`);
        const idMatch = html.match(/"id":(\d+)/) || html.match(/"bookId":(\d+)/);

        if (idMatch) {
            const id = idMatch[1];
            const recommendJson = await fetchURL(`https://api.sansekai.my.id/api/melolo/recommend?bookId=${id}`);
            try {
                const res = JSON.parse(recommendJson);
                const list = res.data || [];
                const mapped = [];
                for (const item of list) {
                    const rSlug = item.book_id || item.id;
                    if (rSlug && !seen.has(rSlug)) {
                        seen.add(rSlug);
                        queue.push(rSlug);
                        discovered++;

                        mapped.push({
                            platform_id: `melolo-${rSlug}`,
                            platform: 'melolo',
                            title: item.book_name || item.title || item.name,
                            description: item.abstract || item.description || "No description",
                            cover_url: item.thumb_url || item.cover || "",
                            updated_at: new Date().toISOString()
                        });
                    }
                }
                if (mapped.length > 0) {
                    await upsertToSupabase(mapped);
                }
            } catch (e) { }
        }
    }
    console.log(`\nCrawler complete. Total unique Melolo titles: ${discovered}`);
}
run();
