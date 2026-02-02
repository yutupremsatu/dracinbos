const https = require('https');
const fs = require('fs');

const fetchURL = (url) => {
    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ code: res.statusCode, data }));
        }).on('error', (e) => resolve({ code: 0, error: e.message }));
    });
};

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('Fetching ReelShort Homepage...');

    const { code, data } = await fetchURL('https://www.reelshort.com/');
    console.log(`Status: ${code}`);

    if (code !== 200) {
        console.log('Failed to fetch homepage');
        return;
    }

    const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (match && match[1]) {
        console.log('Found __NEXT_DATA__!');
        try {
            const json = JSON.parse(match[1]);
            fs.writeFileSync('reelshort_next_data.json', JSON.stringify(json, null, 2));
            console.log('Saved to reelshort_next_data.json');

            // Basic Analysis
            if (json.props && json.props.pageProps) {
                const props = json.props.pageProps;
                console.log('Keys in pageProps:', Object.keys(props));

                // Look for arrays that might be dramas
                const findArrays = (obj, path = '') => {
                    for (const k in obj) {
                        if (Array.isArray(obj[k])) {
                            if (obj[k].length > 0 && obj[k][0].title) {
                                console.log(`Potential Drama List at ${path}.${k} (Length: ${obj[k].length})`);
                            } else if (obj[k].length > 0 && obj[k][0].bookId) {
                                console.log(`Potential Book List at ${path}.${k} (Length: ${obj[k].length})`);
                            }
                        } else if (typeof obj[k] === 'object' && obj[k] !== null && path.length < 50) {
                            findArrays(obj[k], `${path}.${k}`);
                        }
                    }
                };
                findArrays(props);
            }
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
        }
    } else {
        console.log('__NEXT_DATA__ NOT FOUND');
        console.log('Preview:', data.substring(0, 500));
        fs.writeFileSync('reelshort_dump.html', data);
    }
}
run();
