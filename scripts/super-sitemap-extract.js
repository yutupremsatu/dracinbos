const https = require('https');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
    });
};

async function run() {
    console.log('--- Super Sitemap Extraction ---');

    // 1. DramaBox.tv
    const dbSitemap = await fetchURL('https://www.dramabox.tv/sitemap.xml');
    const dbLinks = dbSitemap.match(/https:\/\/www\.dramabox\.tv\/video\/\d+/g) || [];
    console.log(`DramaBox.tv: Found ${[...new Set(dbLinks)].length} unique links.`);

    // 2. ReelShort.com
    const rsSitemap = await fetchURL('https://www.reelshort.com/sitemap.xml');
    // If it's an index, we need to find the sub-sitemap
    let rsLinks = rsSitemap.match(/https:\/\/www\.reelshort\.com\/book\/\d+/g) || [];
    if (rsLinks.length === 0 && rsSitemap.includes('sitemap')) {
        const subs = rsSitemap.match(/https:\/\/www\.reelshort\.com\/sitemap_[a-z0-9_]+\.xml/g) || [];
        console.log(`ReelShort Index: Found ${subs.length} sub-sitemaps.`);
        for (const s of subs) {
            const subData = await fetchURL(s);
            const found = subData.match(/https:\/\/www\.reelshort\.com\/book\/\d+/g) || [];
            rsLinks.push(...found);
        }
    }
    console.log(`ReelShort.com: Found ${[...new Set(rsLinks)].length} total unique links.`);

    // 3. Summarize
    const results = {
        dramabox: [...new Set(dbLinks.map(l => l.split('/').pop()))],
        reelshort: [...new Set(rsLinks.map(l => l.split('/').pop()))]
    };

    require('fs').writeFileSync('super-sitemap-results.json', JSON.stringify(results));
    console.log('Results saved to super-sitemap-results.json');
}
run();
