const https = require('https');
const fs = require('fs');

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

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- Recursive Discovery ---');

    // Seed with some popular dramas
    const seeds = [
        'https://melolo.com/dramas/turning-back-the-apocalypse',
        'https://melolo.com/dramas/ceo-husband-is-a-superstar',
        'https://www.reelshort.com/book/123',
        'https://www.dramabox.com/video/123'
    ];

    const discovered = new Set(seeds);
    const queue = [...seeds];
    const visited = new Set();

    let limit = 5; // Small limit for probe
    while (queue.length > 0 && limit > 0) {
        const url = queue.shift();
        if (visited.has(url)) continue;
        visited.add(url);
        limit--;

        console.log(`[Crawling] ${url}`);
        const html = await fetchURL(url);
        if (!html) continue;

        // Extract /dramas/ links for Melolo
        if (url.includes('melolo.com')) {
            const matches = html.match(/\/dramas\/([a-z0-9-]+)/g) || [];
            matches.forEach(m => {
                const full = `https://melolo.com${m}`;
                if (!discovered.has(full)) {
                    discovered.add(full);
                    queue.push(full);
                }
            });
        }

        // Extract /book/ links for ReelShort
        if (url.includes('reelshort.com')) {
            const matches = html.match(/\/book\/(\d+)/g) || [];
            matches.forEach(m => {
                const full = `https://www.reelshort.com${m}`;
                if (!discovered.has(full)) {
                    discovered.add(full);
                    queue.push(full);
                }
            });
        }
    }

    console.log(`Total Discovered unique dramas: ${discovered.size}`);
    console.log('Sample Discovered:', [...discovered].slice(0, 10));
}
run();
