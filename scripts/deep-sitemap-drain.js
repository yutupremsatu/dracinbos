const https = require('https');
const fs = require('fs');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000,
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
    console.log('--- Deep Sitemap Drain ---');

    const indexUrls = [
        'https://www.reelshort.com/sitemap_index.xml',
        'https://www.dramabox.com/sitemap_index.xml'
    ];

    const allLinks = [];
    for (const index of indexUrls) {
        console.log(`Processing Index: ${index}`);
        const data = await fetchURL(index);
        const subs = data.match(/https:\/\/[^<]+\.xml/g) || [];
        console.log(`  Found ${subs.length} sub-sitemaps.`);

        for (const s of subs) {
            console.log(`    Fetching: ${s}`);
            const subData = await fetchURL(s);
            // Patterns: /book/ID, /video/ID
            const links = subData.match(/https?:\/\/[^\/]+\/(book|video|drama)\/[a-z0-9-]+/gi) || [];
            allLinks.push(...links);
            console.log(`      Links found: ${links.length}`);
        }
    }

    const unique = [...new Set(allLinks)];
    console.log(`\nTOTAL UNIQUE LINKS DISCOVERED: ${unique.length}`);
    fs.writeFileSync('deep-sitemap-links.json', JSON.stringify(unique, null, 2));
}
run();
