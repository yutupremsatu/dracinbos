const https = require('https');
const fs = require('fs');

const platforms = ['melolo/latest', 'flickreels/latest', 'freereels/homepage'];
const API_BASE = 'https://api.sansekai.my.id/api';

const fetchPlatform = (path) => {
    return new Promise((resolve) => {
        const url = `${API_BASE}/${path}`;
        console.log(`[Sync] Fetching ${url}...`);
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (e) { resolve(null); }
                } else {
                    console.log(`[Sync] Failed ${path}: ${res.statusCode}`);
                    resolve(null);
                }
            });
        }).on('error', (e) => resolve(null));
    });
};

const runSync = async () => {
    console.log("Starting Deep Sync backup...");
    for (const p of platforms) {
        const data = await fetchPlatform(p);
        if (data) {
            fs.writeFileSync(`backup-${p.replace('/', '-')}.json`, JSON.stringify(data, null, 2));
            console.log(`[Sync] Saved backup for ${p}`);
        }
    }
    console.log("Deep Sync complete.");
};

runSync();
