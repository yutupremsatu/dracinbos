const https = require('https');

// Platforms requesting by user (excluding already implemented ones)
const platforms = [
    'dramawave',
    'goodshort',
    'flareflow',
    'shortmax',
    'stardusttv',
    'flextv',
    'dramabite',
    'idrama',
    'reelif',
    'vigloo',
    'melololo', // user mentioned MeloLolo
    'meloshort',
    'shortshort',
    'fundrama',
    'sodareels',
    'microdrama',
    // Variations just in case
    'reelife',
    'stardust',
    'shorttv',
    'tikshort'
];

const paths = ['homepage', 'latest', 'foryou', 'trending', 'index', 'home'];

const checkEndpoint = (platform, path) => {
    return new Promise((resolve) => {
        const url = `https://api.sansekai.my.id/api/${platform}/${path}`;
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    // Verify if it's actual JSON and not an HTML error page usually sent by some proxies
                    try {
                        JSON.parse(data);
                        console.log(`[FOUND] ${platform} at /${path} (Status: 200, Length: ${data.length})`);
                        resolve({ platform, path, status: 200, validJson: true });
                    } catch (e) {
                        console.log(`[FOUND-BUT-INVALID] ${platform} at /${path} (Status: 200, Not JSON)`);
                        resolve({ platform, path, status: 200, validJson: false });
                    }
                } else if (res.statusCode === 403) {
                    console.log(`[RESTRICTED] ${platform} at /${path} (Status: 403)`);
                    resolve({ platform, path, status: 403 });
                } else if (res.statusCode !== 404) {
                    console.log(`[POSSIBLE] ${platform} at /${path} (Status: ${res.statusCode})`);
                    resolve({ platform, path, status: res.statusCode });
                } else {
                    // 404 - Not found, ignore to keep output clean
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[ERROR] ${platform}: ${e.message}`);
            resolve(null);
        });
    });
};

async function scan() {
    console.log("Scanning for user-requested platforms on upstream API...");
    const results = [];

    // Chunk inquiries to avoid rate limiting
    for (const platform of platforms) {
        for (const path of paths) {
            const result = await checkEndpoint(platform, path);
            if (result) results.push(result);
            // small delay
            await new Promise(r => setTimeout(r, 100));
        }
    }

    console.log("\n--- Discovery Complete ---");
    console.log(JSON.stringify(results, null, 2));
}

scan();
