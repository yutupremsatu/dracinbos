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
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- Total Sitemap Drain ---');

    const targets = [
        { name: 'melolo', url: 'https://melolo.com/sitemap.xml', pattern: /https?:\/\/melolo\.com\/dramas\/([a-z0-9-]+)/g },
        { name: 'reelshort', url: 'https://www.reelshort.com/sitemap.xml', pattern: /https?:\/\/www\.reelshort\.com\/book\/(\d+)/g },
        { name: 'shorttv', url: 'https://www.shorttv.id/sitemap.xml', pattern: /https?:\/\/www\.shorttv\.id\/drama\/(\d+)/g },
        { name: 'dramabox', url: 'https://www.dramabox.com/sitemap.xml', pattern: /https?:\/\/www\.dramabox\.com\/video\/(\d+)/g },
        { name: 'goodshort', url: 'https://www.goodshort.com/sitemap.xml', pattern: /https?:\/\/www\.goodshort\.com\/video\/([a-z0-9-]+)/g },
        { name: 'moboreels', url: 'https://www.moboreels.com/sitemap.xml', pattern: /https?:\/\/www\.moboreels\.com\/drama\/(\d+)/g },
        { name: 'topshort', url: 'https://www.topshort.tv/sitemap.xml', pattern: /https?:\/\/www\.topshort\.tv\/play\/(\d+)/g },
        { name: 'flexitv', url: 'https://www.flexitv.com/sitemap.xml', pattern: /https?:\/\/www\.flexitv\.com\/video\/(\d+)/g }
    ];

    const allSlugs = {};
    for (const t of targets) {
        console.log(`[Drain] Probing ${t.name}...`);
        const data = await fetchURL(t.url);
        if (data) {
            const matches = data.match(t.pattern) || [];
            const slugs = [...new Set(matches.map(l => l.split('/').pop()))];
            console.log(`  -> Found ${slugs.length} unique slugs.`);
            allSlugs[t.name] = slugs;
        } else {
            console.log(`  -> Failed to fetch sitemap for ${t.name}`);
        }
    }

    fs.writeFileSync('all-sitemap-slugs.json', JSON.stringify(allSlugs, null, 2));
    console.log('Results saved to all-sitemap-slugs.json');
}
run();
