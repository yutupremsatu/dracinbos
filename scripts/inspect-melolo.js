const https = require('https');

https.get('https://api.sansekai.my.id/api/melolo/latest', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            console.log("Raw Data Sample:", data.substring(0, 1000));
        } catch (e) {
            console.log("Error:", e);
        }
    });
});
