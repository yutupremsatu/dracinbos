const https = require('https');
const fs = require('fs');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            },
            timeout: 10000,
            rejectUnauthorized: false
        };
        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ url, status: res.statusCode, data }));
        });
        req.on('error', (e) => resolve({ url, status: 500, error: e.message, data: '' }));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const platforms = [
        { name: 'shorttv', url: 'https://www.shorttv.id/' },
        { name: 'flexitv', url: 'https://www.flexitv.com/' },
        { name: 'goodshort', url: 'https://www.goodshort.com/' },
        { name: 'moboreels', url: 'https://www.moboreels.com/' },
        { name: 'topshort', url: 'https://www.topshort.tv/' },
        { name: 'shotv', url: 'https://www.shotv.com/' },
        { name: 'playlet', url: 'https://www.playlet.tv/' },
        { name: 'anidrama', url: 'https://www.anidrama.com/' },
        { name: 'stardust', url: 'https://www.stardust.com/' }
    ];

    const results = [];
    for (const p of platforms) {
        console.log(`Probing ${p.name}...`);
        const res = await fetchURL(p.url);

        const dramas = new Set();
        // Pattern 1: bookId/playId/id
        const idMatches = res.data.matchAll(/"(bookId|playId|id|book_id|shortPlayId)":(\d+|"[a-z0-9-]+")/g);
        for (const m of idMatches) {
            dramas.add(m[2].replace(/"/g, ''));
        }

        // Pattern 2: __NEXT_DATA__
        if (res.data.includes('__NEXT_DATA__')) {
            console.log(`  Found __NEXT_DATA__ on ${p.name}`);
        }

        console.log(`  Found ${dramas.size} potential IDs on home page.`);
        results.push({ name: p.name, url: p.url, count: dramas.size });
    }

    fs.writeFileSync('mega-discovery-results.json', JSON.stringify(results, null, 2));
}
run();
