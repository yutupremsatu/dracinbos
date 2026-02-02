const https = require('https');

const platforms = {
    dramabox: ['foryou', 'latest', 'trending', 'hot', 'recommend', 'search', 'list'],
    reelshort: ['homepage', 'latest', 'trending', 'hot', 'recommend', 'search', 'list'],
    netshort: ['foryou', 'latest', 'trending', 'hot', 'recommend', 'search', 'list'],
    melolo: ['latest', 'homepage', 'trending', 'hot', 'recommend', 'search', 'list'],
    flickreels: ['latest', 'homepage', 'trending', 'hot', 'recommend', 'search', 'list'],
    freereels: ['homepage', 'latest', 'trending', 'hot', 'recommend', 'search', 'list']
};

const checkEndpoint = (platform, path) => {
    return new Promise((resolve) => {
        const url = `https://api.sansekai.my.id/api/${platform}/${path}`;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        };
        const req = https.get(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const itemsCount = () => {
                    try {
                        const json = JSON.parse(data);
                        if (Array.isArray(json)) return json.length;
                        if (json.data && Array.isArray(json.data)) return json.data.length;
                        if (json.data && json.data.books && Array.isArray(json.data.books)) return json.data.books.length;
                        if (json.data && json.data.items && Array.isArray(json.data.items)) return json.data.items.length;
                        if (json.data && json.data.contentInfos && Array.isArray(json.data.contentInfos)) return json.data.contentInfos.length;
                        return 'JSON (Object)';
                    } catch (e) { return 'Invalid JSON'; }
                };
                console.log(`[STATUS] ${platform}/${path} -> ${res.statusCode} (${itemsCount()})`);
                if (res.statusCode === 200) {
                    resolve({ platform, path, status: 200 });
                } else {
                    resolve(null);
                }
            });
        });
        req.on('error', (e) => {
            console.log(`[ERROR] ${platform}/${path} -> ${e.message}`);
            resolve(null);
        });
    });
};

const scan = async () => {
    console.log("Starting deep probe of working platforms...");
    const results = [];
    for (const platform of Object.keys(platforms)) {
        for (const path of platforms[platform]) {
            const res = await checkEndpoint(platform, path);
            if (res) results.push(res);
        }
    }
    console.log("\nScan complete.");
};

scan();
