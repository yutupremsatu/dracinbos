const https = require('https');
const fs = require('fs');

const fetchURL = (url, options = {}) => {
    return new Promise((resolve) => {
        const defaultOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            }
        };
        const mergedOptions = { ...defaultOptions, ...options };
        mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

        const req = https.get(url, mergedOptions, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log(`[Fetch] ${url} -> Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
                } else { resolve(null); }
            });
        });
        req.on('error', (e) => {
            console.error(`[Fetch Error] ${url}: ${e.message}`);
            resolve(null);
        });
    });
};

const extractMelolo = async () => {
    console.log("[DeepSync] Scraping Melolo...");
    const html = await fetchURL('https://melolo.com/');
    if (!html || typeof html !== 'string') {
        console.log("[DeepSync] Failed to fetch Melolo HTML.");
        return [];
    }

    // Check for Next Data
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (match) {
        try {
            const nextData = JSON.parse(match[1]);
            fs.writeFileSync('melolo-raw.json', JSON.stringify(nextData, null, 2));
            console.log("[DeepSync] Melolo JSON extracted.");

            // Try to find the books list
            let books = [];
            // Common path for Next.js lists: props.pageProps.initialData or similar
            if (nextData.props?.pageProps?.initialData?.books) {
                books = nextData.props.pageProps.initialData.books;
            } else if (nextData.props?.pageProps?.books) {
                books = nextData.props.pageProps.books;
            }

            console.log(`[DeepSync] Found ${books.length} books in Melolo Next Data.`);
            return books;
        } catch (e) { console.error("Melolo JSON parsing failed", e); }
    } else {
        console.log("[DeepSync] __NEXT_DATA__ not found in Melolo HTML.");
        // Save HTML for debugging if it's not JSON
        fs.writeFileSync('melolo-debug.html', html.substring(0, 5000));
    }
    return [];
};

const run = async () => {
    await extractMelolo();
};

run();
