const https = require('https');
const fs = require('fs');

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
    console.log('--- DramaBox Deep Dump ---');
    const html = await fetchURL('https://www.dramabox.com/');
    const match = html.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (match) {
        fs.writeFileSync('dramabox-next-data.json', match[1]);
        console.log('DramaBox NEXT_DATA saved to dramabox-next-data.json');

        try {
            const json = JSON.parse(match[1]);
            const pageProps = json.props?.pageProps;
            console.log('Sections Found:', Object.keys(pageProps || {}));
        } catch (e) {
            console.error('Parse Error:', e.message);
        }
    } else {
        console.log('NEXT_DATA not found in HTML');
    }
}
run();
