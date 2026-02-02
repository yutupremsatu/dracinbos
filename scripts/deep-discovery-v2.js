const https = require('https');
const fs = require('fs');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' },
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
    const results = [];
    console.log('--- Deep Platform Discovery (Surgical) ---');

    const domains = [
        'melolo.com',
        'www.reelshort.com',
        'www.dramabox.com',
        'www.netshort.com',
        'www.shorttv.id',
        'www.moboreels.com',
        'www.goodshort.com',
        'www.topshort.tv'
    ];

    for (const domain of domains) {
        let sitemaps = [];
        console.log(`Checking ${domain}...`);
        const robots = await fetchURL(`https://${domain}/robots.txt`);
        if (robots.status === 200) {
            const matches = robots.data.match(/Sitemap:\s*(.*)/gi) || [];
            sitemaps = matches.map(m => m.split(/Sitemap:\s*/i)[1].trim());
        }
        if (sitemaps.length === 0) {
            sitemaps.push(`https://${domain}/sitemap.xml`);
        }

        for (const sUrl of sitemaps) {
            const res = await fetchURL(sUrl);
            results.push({ domain, sitemaps: sUrl, status: res.status, length: res.data.length });
        }
    }

    fs.writeFileSync('discovery-output.json', JSON.stringify(results, null, 2));
    console.log('Discovery results saved to discovery-output.json');
}
run();
