const https = require('https');
const fs = require('fs');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000,
            rejectUnauthorized: false
        };
        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ url, status: res.statusCode, data }));
        });
        req.on('error', () => resolve({ url, status: 500, data: '' }));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const domains = [
        'melolo.com', 'www.reelshort.com', 'www.dramabox.com', 'www.netshort.com',
        'www.shorttv.id', 'www.goodshort.com', 'www.moboreels.com', 'www.topshort.tv',
        'www.flickreels.com', 'www.flexitv.com'
    ];

    const candidates = [
        'sitemap.xml', 'sitemap_index.xml', 'sitemap-index.xml', 'sitemap_1.xml',
        'en/sitemap.xml', 'video-sitemap.xml', 'drama-sitemap.xml'
    ];

    const results = [];
    for (const d of domains) {
        console.log(`Scanning ${d}...`);
        for (const c of candidates) {
            const url = `https://${d}/${c}`;
            const res = await fetchURL(url);
            if (res.status === 200 && res.data.includes('<sitemap') || res.data.includes('<url')) {
                console.log(`  [HIT] ${url} (Len: ${res.data.length})`);
                results.push({ url, length: res.data.length });
            }
        }
    }
    fs.writeFileSync('sitemap-hunt-results.json', JSON.stringify(results, null, 2));
}
run();
