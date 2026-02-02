const https = require('https');
const fs = require('fs');

const fetchHTML = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://www.google.com/'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
};

const crawlDramaBox = async () => {
    console.log("Crawling DramaBox category pages...");
    const urls = [
        'https://www.dramaboxdb.com/',
        'https://www.dramaboxdb.com/search?keyword=a',
        'https://www.dramaboxdb.com/search?keyword=ceo'
    ];

    let foundIds = new Set();

    for (const url of urls) {
        const html = await fetchHTML(url);
        if (!html) continue;

        // Look for typical DramaBox book links: /detail/41000122558
        const matches = html.matchAll(/\/detail\/(\d+)/g);
        for (const match of matches) {
            foundIds.add(match[1]);
        }
    }

    console.log(`Found ${foundIds.size} unique DramaBox IDs.`);
    fs.writeFileSync('crawled-ids.json', JSON.stringify(Array.from(foundIds), null, 2));
};

crawlDramaBox();
