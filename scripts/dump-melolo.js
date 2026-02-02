const https = require('https');
const fs = require('fs');

https.get('https://api.sansekai.my.id/api/melolo/latest', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        fs.writeFileSync('melolo.json', data);
        console.log("Done");
    });
});
