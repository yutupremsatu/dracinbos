const https = require('https');

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
    console.log('--- Deep Platform Discovery ---');

    const domains = [
        'melolo.com',
        'www.reelshort.com',
        'www.dramabox.com',
        'www.netshort.com',
        'www.shorttv.id',
        'www.flickreels.com',
        'www.goodshort.com',
        'www.moboreels.com',
        'www.topshort.tv',
        'www.flexitv.com',
        'www.playlet.tv',
        'www.shotv.com'
    ];

    for (const domain of domains) {
        console.log(`Checking ${domain}...`);
        const robots = await fetchURL(`https://${domain}/robots.txt`);
        console.log(`  [${robots.status}] Robots.txt length: ${robots.data.length}`);

        const sitemaps = robots.data.match(/Sitemap:\s*(.*)/gi) || [];
        if (sitemaps.length > 0) {
            for (const s of sitemaps) {
                const sUrl = s.split(/Sitemap:\s*/i)[1].trim();
                console.log(`  Found Sitemap: ${sUrl}`);
                const sData = await fetchURL(sUrl);
                console.log(`    [${sData.status}] Sitemap length: ${sData.data.length}`);
            }
        } else {
            const sxml = await fetchURL(`https://${domain}/sitemap.xml`);
            console.log(`  [${sxml.status}] Standard sitemap.xml: ${sxml.data.length}`);
        }
    }
}
run();
