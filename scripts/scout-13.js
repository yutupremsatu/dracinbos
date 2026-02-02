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
    console.log('--- Scouting for 13+ Items ---');
    const u1 = 'https://www.dramabox.com/channel';
    const u2 = 'https://www.shorttv.id/';

    const h1 = await fetchURL(u1);
    const h2 = await fetchURL(u2);

    const names = new Set();
    const m1 = h1.matchAll(/\"bookName\":\"(.*?)\"/g);
    for (const m of m1) names.add(m[1]);

    const m2 = h2.matchAll(/title=\"(.*?)\"/g);
    for (const m of m2) if (m[0].includes('drama')) names.add(m[1]);

    console.log('Unique Names Found Total:', names.size);
    if (names.size > 20) {
        console.log('Sample Extra Names:', [...names].slice(15, 25));
    }
}
run();
