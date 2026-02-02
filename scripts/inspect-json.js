const https = require('https');

const fetchJson = (url, name) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`\n=== ${name} ===`);

                    let items = [];
                    if (Array.isArray(json)) items = json;
                    else if (json.data && Array.isArray(json.data)) items = json.data;
                    else if (json.list && Array.isArray(json.list)) items = json.list;
                    else if (json.data && json.data.list) items = json.data.list;

                    if (items.length > 0) {
                        const item = items[0];
                        console.log("Keys:", Object.keys(item));
                        // Print sample of important looking keys
                        const sample = {};
                        Object.keys(item).forEach(k => {
                            if (['id', 'title', 'name', 'cover', 'img', 'pic', 'url', 'book'].some(sub => k.toLowerCase().includes(sub))) {
                                sample[k] = item[k];
                            }
                        });
                        console.log("Sample:", JSON.stringify(sample, null, 2));
                    } else {
                        console.log("No items found. Raw keys:", Object.keys(json));
                    }
                } catch (e) {
                    console.log(`${name} Error:`, e.message);
                }
                resolve();
            });
        });
    });
};

async function run() {
    await fetchJson('https://api.sansekai.my.id/api/melolo/latest', 'Melolo');
    await fetchJson('https://api.sansekai.my.id/api/flickreels/latest', 'FlickReels');
    await fetchJson('https://api.sansekai.my.id/api/freereels/homepage', 'FreeReels');
}

run();
