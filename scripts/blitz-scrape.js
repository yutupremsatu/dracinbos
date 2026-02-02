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
    console.log('--- Blitz Scrape ---');
    const urls = ['https://www.dramabox.com/channel', 'https://www.reelshort.com/', 'https://www.netshort.com/'];
    const names = new Set();

    for (const u of urls) {
        const h = await fetchURL(u);
        const matches = h.matchAll(/(title|name|bookName|shortPlayName)":"(.*?)"/g);
        for (const m of matches) {
            const n = m[2];
            if (n.length > 3 && n.length < 100 && !n.includes('{') && !n.includes('<')) names.add(n);
        }
    }

    console.log('Total Potential Titles Found:', names.size);
    if (names.size > 20) {
        console.log('Sample Names:', [...names].slice(0, 50));
    }
}
run();
