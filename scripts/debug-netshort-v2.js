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
    console.log('--- NetShort Deep Probe ---');
    const html = await fetchURL('https://www.netshort.com/');

    // Look for both escaped and unescaped patterns
    const idRegex = /shortPlayId":(\d+)/g;
    const nameRegex = /shortPlayName":"(.*?)"/g;

    const ids = [];
    const names = [];
    let m;

    while ((m = idRegex.exec(html))) ids.push(m[1]);
    while ((m = nameRegex.exec(html))) names.push(m[1]);

    console.log(`Found IDs: ${ids.length}, Names: ${names.length}`);
    if (ids.length > 0) {
        console.log('Sample ID:', ids[0]);
        console.log('Sample Name:', names[0]);
    }
}
run();
