const https = require('https');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('Fetching Detail Page...');
    // Known ID from previous inspection
    const id = '36c84cbe-5183-424a-8926-d922e4318d18';
    const html = await fetchURL(`https://www.reelshort.com/book/${id}`);

    console.log(`Length: ${html.length}`);

    // Check for NEXT_DATA again (it's consistent in Next.js apps)
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (match) {
        console.log('Found __NEXT_DATA__ in Detail Page!');
        try {
            const json = JSON.parse(match[1]);
            // Look for recommendations
            let found = 0;
            const findRecs = (obj) => {
                if (!obj || typeof obj !== 'object') return;
                if (Array.isArray(obj)) {
                    for (const item of obj) {
                        if (item.bookId && item.bookId !== id) {
                            console.log(`Rec: ${item.bookId} | ${item.bookName || item.title}`);
                            found++;
                        }
                    }
                }
                for (const k in obj) {
                    if (typeof obj[k] === 'object') findRecs(obj[k]);
                }
            };

            // Limit search scope to likely props to avoid noise
            if (json.props && json.props.pageProps) {
                console.log('Scanning pageProps...');
                // Usually under 'recommendModule' or similar
                findRecs(json.props.pageProps);
            }
            console.log(`Total Recs Found: ${found}`);

        } catch (e) { console.log('JSON Parse Error'); }
    } else {
        console.log('No NEXT_DATA found. Checking regex for links...');
        const links = html.match(/\/book\/([a-z0-9-]+)/g) || [];
        console.log(`Regex Links found: ${links.length}`);
    }
}
run();
