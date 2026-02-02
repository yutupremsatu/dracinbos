const https = require('https');
const fs = require('fs');

const fetchHTML = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
};

const extractNextData = async (url, filename) => {
    const html = await fetchHTML(url);
    if (!html) return;
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (match) {
        fs.writeFileSync(filename, match[1]);
        console.log(`Saved ${filename}`);
    } else {
        console.log(`__NEXT_DATA__ not found on ${url}`);
    }
};

const run = async () => {
    await extractNextData('https://www.dramaboxdb.com/', 'dramabox-home.json');
    await extractNextData('https://www.reelshort.com/', 'reelshort-home.json');
};

run();
