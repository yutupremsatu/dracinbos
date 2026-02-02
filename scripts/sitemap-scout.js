const https = require('https');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
    });
};

async function run() {
    console.log('--- Fetching Sitemaps ---');

    const meloloSitemap = await fetchURL('https://melolo.com/sitemap.xml');
    const meloloLinks = meloloSitemap.match(/https:\/\/melolo\.com\/dramas\/[a-z0-9-]+/g) || [];
    console.log(`Melolo Sitemap: Found ${[...new Set(meloloLinks)].length} unique links.`);

    const netshortSitemap = await fetchURL('https://www.netshort.com/sitemap.xml');
    const netshortLinks = netshortSitemap.match(/https:\/\/www\.netshort\.com\/play\/(\d+)/g) || [];
    console.log(`NetShort Sitemap: Found ${[...new Set(netshortLinks)].length} unique links.`);

    const reelshortSitemap = await fetchURL('https://www.reelshort.com/sitemap.xml');
    const reelshortLinks = reelshortSitemap.match(/https:\/\/www\.reelshort\.com\/book\/(\d+)/g) || [];
    console.log(`ReelShort Sitemap: Found ${[...new Set(reelshortLinks)].length} unique links.`);
}
run();
