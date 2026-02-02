const https = require('https');

const SUPABASE_URL = 'https://kbcchztwbczadhpkwonm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

// Common Fetcher with Retry
const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 20000,
            rejectUnauthorized: false
        };
        const req = https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                fetchURL(res.headers.location).then(resolve);
                return;
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', (e) => {
            // console.error(`Fetch error for ${url}: ${e.message}`);
            resolve('');
        });
    });
};

const upsertBatch = async (data) => {
    if (!data.length) return 0;
    // Split into chunks of 100 to avoid payload limits
    const CHUNK_SIZE = 100;
    let saved = 0;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await new Promise((resolve) => {
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
            req.write(JSON.stringify(chunk));
            req.end();
        });
        saved += chunk.length;
        process.stdout.write(`.`);
    }
    return saved;
};

// --- STRATEGY 1: REELSHORT HIDDEN SITEMAP INDEX ---
async function drainReelShort() {
    console.log('\n[ReelShort] Starting Sitemap Drain...');
    const indexUrl = 'https://www.reelshort.com/sitexml/sitemap.xml';
    const indexXml = await fetchURL(indexUrl);

    // Find sub-sitemaps
    const subMaps = indexXml.match(/https?:\/\/[^<]+\.xml/g) || [];
    console.log(`[ReelShort] Found ${subMaps.length} sub-sitemaps.`);

    let total = 0;
    for (const subUrl of subMaps) {
        // Filter for relevant sitemaps if possible (usually book or drama)
        // ReelShort seems to use /book/ or /drama/
        const subXml = await fetchURL(subUrl);
        const links = subXml.match(/https?:\/\/www\.reelshort\.com\/book\/([a-z0-9-]+)/g) || [];

        if (links.length > 0) {
            const batch = links.map(link => {
                const slug = link.split('/').pop();
                const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return {
                    platform_id: `reelshort-${slug}`,
                    platform: 'reelshort',
                    title: title,
                    description: title, // Minimal metadata, better than nothing
                    cover_url: '', // We can't get cover from sitemap easily without scraping page
                    updated_at: new Date().toISOString()
                };
            });

            // Dedupe locally
            const unique = Array.from(new Map(batch.map(item => [item.platform_id, item])).values());
            const count = await upsertBatch(unique);
            total += count;
            process.stdout.write(`\r[ReelShort] Synced: ${total} `);
        }
    }
    console.log(`\n[ReelShort] Completed. Total: ${total}`);
}

// --- STRATEGY 2: DRAMABOX MIRROR (WilandWillie) ---
async function drainDramaBox() {
    console.log('\n[DramaBox] Starting API Drain via Mirror...');
    // API supports pagination. Let's run pages 1 to 500
    let total = 0;
    const MAX_PAGES = 500;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `https://wilandwillie.com/api/dramabox/latest?page=${page}`;
        try {
            const jsonStr = await fetchURL(url);
            if (!jsonStr) continue;
            const json = JSON.parse(jsonStr);
            const list = json.data || [];

            if (list.length === 0) break; // Stop if empty

            const batch = list.map(item => ({
                platform_id: `dramabox-${item.bookId}`,
                platform: 'dramabox',
                title: item.bookName,
                description: item.introduction || item.bookName,
                cover_url: item.coverH || item.coverW || '',
                updated_at: new Date().toISOString()
            })).filter(i => i.platform_id && i.title);

            const count = await upsertBatch(batch);
            total += count;
            process.stdout.write(`\r[DramaBox] Page ${page}/${MAX_PAGES} | Synced: ${total} `);

            // Mild delay
            // await new Promise(r => setTimeout(r, 100));
        } catch (e) {
            // console.log(`Error page ${page}: ${e.message}`);
        }
    }
    console.log(`\n[DramaBox] Completed. Total: ${total}`);
}

async function run() {
    console.log('=== DIRECT SOURCE DRAIN START ===');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    await Promise.all([
        drainReelShort(),
        drainDramaBox()
    ]);

    console.log('\n=== ALL DRAINS COMPLETE ===');
}

run();
