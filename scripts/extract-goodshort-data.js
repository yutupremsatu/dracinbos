const https = require('https');
const fs = require('fs');

https.get('https://www.goodshort.com/foryou', (res) => {
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
        const match = rawData.match(/window\.data\s*=\s*({.*?});/s);
        if (match) {
            try {
                const data = match[1];
                fs.writeFileSync('goodshort-dump.json', data, 'utf8');
                console.log("Success: wrote goodshort-dump.json");
            } catch (e) {
                console.error("Error writing file:", e);
            }
        } else {
            console.log("Not found");
        }
    });
}).on('error', err => console.error(err));
