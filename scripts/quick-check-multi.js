const https = require('https');

const endpoints = [
    { name: 'Melolo', url: 'https://api.sansekai.my.id/api/melolo/latest' },
    { name: 'FlickReels', url: 'https://api.sansekai.my.id/api/flickreels/latest' },
    { name: 'FreeReels', url: 'https://api.sansekai.my.id/api/freereels/homepage' }
];

endpoints.forEach(ep => {
    https.get(ep.url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`\n--- ${ep.name} ---`);
                if (Array.isArray(json)) {
                    console.log(JSON.stringify(json[0], null, 2));
                } else if (json.data && Array.isArray(json.data)) {
                    console.log(JSON.stringify(json.data[0], null, 2));
                } else if (json.list && Array.isArray(json.list)) {
                    console.log(JSON.stringify(json.list[0], null, 2));
                } else {
                    console.log(JSON.stringify(json, null, 2).substring(0, 500));
                }
            } catch (e) {
                console.log(`${ep.name} Error:`, e.message);
            }
        });
    });
});
