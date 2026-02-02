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
    // NetShort
    const nsMain = await fetchURL('https://netshort.com/sitemap.xml');
    const nsSubs = nsMain.match(/https:\/\/netshort\.com\/sitemap-[a-z0-9-]+\.xml/g) || [];
    console.log('NetShort Subs:', nsSubs);

    // ReelShort
    const rsMain = await fetchURL('https://www.reelshort.com/sitemap.xml');
    const rsSubs = rsMain.match(/https:\/\/www\.reelshort\.com\/sitemap_[a-z0-9_]+\.xml/g) || [];
    console.log('ReelShort Subs:', rsSubs);

    // Scan one deep
    for (const s of [...nsSubs, ...rsSubs]) {
        const content = await fetchURL(s);
        const links = content.match(/https:\/\/(www\.)?(netshort|reelshort)\.com\/(play|book)\/\d+/g) || [];
        if (links.length > 0) {
            console.log(`Found ${links.length} drama links in ${s}`);
        }
    }
}
run();
