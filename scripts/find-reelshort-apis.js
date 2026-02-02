const https = require('https');
const fs = require('fs');

const fetchHTML = (url) => {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
};

const findAPIs = async () => {
    console.log("Searching for APIs in ReelShort homepage...");
    const html = await fetchHTML('https://www.reelshort.com/');
    if (!html) return;

    // Look for anything like https://.../api/ or something containing "graphql" or "query"
    const regex = /https:\/\/[^"'\s]*api[^"'\s]*/g;
    const matches = html.match(regex) || [];

    console.log(`Found ${matches.length} potential API URLs.`);
    fs.writeFileSync('potential-apis.txt', matches.join('\n'));
};

findAPIs();
