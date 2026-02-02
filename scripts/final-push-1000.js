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
    console.log('--- Final Push to 1000 ---');
    const u1 = 'https://www.reelshort.com/hot';
    const u2 = 'https://www.dramabox.com/channel';

    // Sometimes there are more hidden lists
    const h1 = await fetchURL(u1);
    const h2 = await fetchURL(u2);

    const dramas = new Set();
    const matches = (h1 + h2).matchAll(/"(book_id|bookId)":(\d+|"[a-z0-9-]+")/g);
    for (const m of matches) dramas.add(m[2].replace(/\"/g, ''));

    console.log('Total Found IDs:', dramas.size);
    // If we find > 987 total, we are good.
}
run();
