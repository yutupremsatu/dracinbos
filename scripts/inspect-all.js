const https = require('https');

const fetchAndAnalyze = (name, url) => {
    return new Promise(resolve => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log(`\n\n=== ${name} ===`);
                try {
                    const json = JSON.parse(data);

                    // Helper to find array
                    let array = null;
                    if (Array.isArray(json)) array = json;
                    else if (json.data && Array.isArray(json.data)) array = json.data;
                    else if (json.list && Array.isArray(json.list)) array = json.list;
                    else if (json.data && json.data.list && Array.isArray(json.data.list)) array = json.data.list;
                    else if (json.contentInfos) array = json.contentInfos;

                    if (array) {
                        console.log(`Found array of length: ${array.length}`);
                        if (array.length > 0) {
                            console.log("First Item Keys:", Object.keys(array[0]));
                            console.log("Sample Item:", JSON.stringify(array[0], null, 2));
                        }
                    } else {
                        console.log("Structure Unknown. Root Keys:", Object.keys(json));
                        console.log("Root Sample:", JSON.stringify(json, null, 2).substring(0, 300));
                    }
                } catch (e) {
                    console.log("Parse Error:", e.message);
                    console.log("Raw preview:", data.substring(0, 200));
                }
                resolve();
            });
        });
    });
};

async function run() {
    await fetchAndAnalyze('Melolo', 'https://api.sansekai.my.id/api/melolo/latest');
    await fetchAndAnalyze('FlickReels', 'https://api.sansekai.my.id/api/flickreels/latest');
    await fetchAndAnalyze('FreeReels', 'https://api.sansekai.my.id/api/freereels/homepage');
}

run();
