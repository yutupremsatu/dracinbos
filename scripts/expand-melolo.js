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
    const html = await fetchURL('https://melolo.com/category');
    const catMatches = html.matchAll(/href="\/category\/([a-z-]+)"/g);
    const categories = [...new Set([...catMatches].map(m => m[1]))];
    console.log('Categories:', categories);

    // For each category, we can scrape more
    // Melolo usually has /category/[name]
}
run();
