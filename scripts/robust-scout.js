const https = require('https');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        };
        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data, url }));
        });
        req.on('error', () => resolve({ status: 500, data: '', url }));
    });
};

async function run() {
    console.log('--- Robust Sitemap Discovery ---');
    const targets = [
        'https://www.dramabox.tv/sitemap.xml',
        'https://www.reelshort.com/sitemap.xml',
        'https://melolo.com/sitemap.xml',
        'https://www.netshort.com/sitemap.xml',
        'https://www.shorttv.id/sitemap.xml',
        'https://www.moboreels.com/sitemap.xml',
        'https://www.goodshort.com/sitemap.xml'
    ];

    for (const t of targets) {
        const res = await fetchURL(t);
        console.log(`[${res.status}] ${t} - Length: ${res.data.length}`);
        if (res.data.includes('<sitemap>')) {
            console.log(`  -> Sitemap Index Found!`);
            // Extract sub-sitemaps
            const subs = res.data.match(/<loc>(.*?)<\/loc>/g) || [];
            console.log(`  -> Sub-sitemaps: ${subs.length}`);
            subs.slice(0, 3).forEach(s => console.log('     ' + s.replace(/<\/?loc>/g, '')));
        } else if (res.data.includes('<url>')) {
            const links = res.data.match(/<loc>(.*?)<\/loc>/g) || [];
            console.log(`  -> Final Sitemap Found! Links: ${links.length}`);
        }
    }
}
run();
