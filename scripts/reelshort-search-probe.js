const https = require('https');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.reelshort.com/'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ code: res.statusCode, data }));
        }).on('error', () => resolve({ code: 0, data: '' }));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('--- REELSHORT SEARCH PROBE ---');

    // Potential candidates based on typical API patterns
    const candidates = [
        'https://www.reelshort.com/api/search/result?keywords=love',
        'https://www.reelshort.com/api/book/search?keywords=love',
        'https://www.reelshort.com/search/result?keywords=love', // Might return HTML with NEXT_DATA
        'https://www.reelshort.com/api/search?q=love'
    ];

    for (const url of candidates) {
        process.stdout.write(`Checking ${url}... `);
        const { code, data } = await fetchURL(url);
        console.log(`[${code}]`);

        if (code === 200) {
            try {
                const j = JSON.parse(data);
                if (j.data || j.list || j.results) {
                    console.log('  *** JSON API FOUND! ***');
                    console.log(`  Preview: ${data.substring(0, 100)}`);
                    return; // Stop if found
                }
            } catch {
                if (data.includes('__NEXT_DATA__')) {
                    console.log('  *** HTML with NEXT_DATA (SSR Search) ***');
                    return;
                }
            }
        }
    }
    console.log('Probe complete.');
}
run();
