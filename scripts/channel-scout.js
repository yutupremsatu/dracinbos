const https = require('https');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ url, data, status: res.statusCode }));
        });
        req.on('error', () => resolve({ url, data: '', status: 500 }));
    });
};

async function run() {
    const targets = [
        'https://www.dramabox.com/channel',
        'https://www.dramabox.com/category',
        'https://www.reelshort.com/channel',
        'https://www.reelshort.com/hot',
        'https://www.netshort.com/channel',
        'https://www.netshort.com/explore'
    ];

    console.log('--- Deep Channel Scouting ---');
    for (const t of targets) {
        const res = await fetchURL(t);
        console.log(`[${res.status}] ${t} - Length: ${res.data.length}`);
        if (res.data.includes('__NEXT_DATA__')) console.log(`  -> Found NEXT_DATA in ${t}`);
    }
}
run();
