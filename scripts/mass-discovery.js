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
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', () => resolve({ status: 500, data: '' }));
    });
};

const checkPoster = (url) => {
    if (!url || !url.startsWith('http')) return Promise.resolve(false);
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.end();
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

const PLATFORMS = {
    shorttv: {
        baseUrl: 'https://www.shorttv.id/drama/',
        extract: (html, id) => {
            const nameMatch = html.match(/<title>([^<]+)<\/title>/);
            const coverMatch = html.match(/<img[^>]+src="([^"]+)"[^>]+class="poster"/); // Example pattern
            if (nameMatch && !nameMatch[1].includes('404')) {
                return {
                    platform_id: `shorttv-${id}`,
                    platform: 'shorttv',
                    title: nameMatch[1].replace(' - ShortTV', '').trim(),
                    description: `ShortTV Drama ${id}`,
                    cover_url: coverMatch ? coverMatch[1] : `https://img.shorttv.com/cover/${id}.jpg`, // Estimated
                    updated_at: new Date().toISOString()
                };
            }
            return null;
        }
    },
    reelshort: {
        baseUrl: 'https://www.reelshort.com/book/',
        extract: (html, id) => {
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
            if (nextDataMatch) {
                try {
                    const json = JSON.parse(nextDataMatch[1]);
                    const book = json.props?.pageProps?.bookInfo || json.props?.pageProps?.videoInfo;
                    if (book && book.bookName) {
                        return {
                            platform_id: `reelshort-${id}`,
                            platform: 'reelshort',
                            title: book.bookName,
                            description: book.introduction || book.abstract || "",
                            cover_url: book.coverH || book.book_pic || book.thumb_url,
                            updated_at: new Date().toISOString()
                        };
                    }
                } catch (e) { }
            }
            return null;
        }
    },
    dramabox: {
        baseUrl: 'https://www.dramabox.com/video/',
        extract: (html, id) => {
            // DramaBox uses NextData too
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
            if (nextDataMatch) {
                try {
                    const json = JSON.parse(nextDataMatch[1]);
                    const book = json.props?.pageProps?.bookInfo;
                    if (book && book.bookName) {
                        return {
                            platform_id: `dramabox-${id}`,
                            platform: 'dramabox',
                            title: book.bookName,
                            description: book.introduction || "",
                            cover_url: book.coverH || book.book_pic,
                            updated_at: new Date().toISOString()
                        };
                    }
                } catch (e) { }
            }
            return null;
        }
    }
};

async function probeRange(name, start, end) {
    console.log(`=== Probing ${name} [${start} - ${end}] ===`);
    const platform = PLATFORMS[name];
    const BATCH_SIZE = 20;

    for (let i = start; i <= end; i += BATCH_SIZE) {
        process.stdout.write(`\r[${name}] Progress: ${i}/${end}...`);
        const batchIds = Array.from({ length: BATCH_SIZE }, (_, j) => i + j).filter(id => id <= end);

        const results = await Promise.all(batchIds.map(async (id) => {
            const res = await fetchURL(`${platform.baseUrl}${id}`);
            if (res.status === 200) {
                const drama = platform.extract(res.data, id);
                if (drama) {
                    const isValid = await checkPoster(drama.cover_url);
                    if (isValid) return drama;
                }
            }
            return null;
        }));

        const valid = results.filter(r => r !== null);
        if (valid.length > 0) {
            console.log(`\n  [${name}] Found ${valid.length} valid dramas.`);
            await upsertToSupabase(valid);
        }
    }
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const target = process.argv[2] || 'shorttv';
    const start = parseInt(process.argv[3]) || 1;
    const end = parseInt(process.argv[4]) || 1000;

    await probeRange(target, start, end);
}

run();
