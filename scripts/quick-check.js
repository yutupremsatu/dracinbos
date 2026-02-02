const https = require('https');

const url = 'https://api.sansekai.my.id/api/reelshort/homepage';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            // The API likely returns { items: [...] } or [{...}] 
            // We print the first 2 items to see structure
            console.log(JSON.stringify(json.slice(0, 2), null, 2));
        } catch (e) {
            console.log("Raw data sample:", data.substring(0, 500));
            console.log("Error:", e.message);
        }
    });
}).on('error', (err) => {
    console.error("Error: " + err.message);
});
