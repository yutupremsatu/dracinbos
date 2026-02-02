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
    console.log('--- Deep Data Extraction ---');

    // DramaBox Channel
    const dbHtml = await fetchURL('https://www.dramabox.com/channel');
    const dbMatch = dbHtml.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (dbMatch) fs.writeFileSync('dramabox-channel-data.json', dbMatch[1]);

    // ReelShort Channel
    const rsHtml = await fetchURL('https://www.reelshort.com/channel');
    const rsMatch = rsHtml.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (rsMatch) fs.writeFileSync('reelshort-channel-data.json', rsMatch[1]);

    console.log('Data saved. Analyzing counts...');

    // Quick Count Probe
    const probe = (file, name) => {
        try {
            const json = JSON.parse(fs.readFileSync(file, 'utf8'));
            const walk = (obj, counts) => {
                if (Array.isArray(obj)) counts.push(obj.length);
                else if (obj && typeof obj === 'object') Object.keys(obj).forEach(k => walk(obj[k], counts));
            };
            const counts = [];
            walk(json.props?.pageProps || {}, counts);
            console.log(`${name} Max Array Length: ${Math.max(...counts, 0)}`);
        } catch (e) { }
    };

    probe('dramabox-channel-data.json', 'DramaBox Channel');
    probe('reelshort-channel-data.json', 'ReelShort Channel');
}
run();
