const https = require('https');
const fs = require('fs');

const dump = (url, file) => {
    https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            fs.writeFileSync(file, data);
            console.log("Done " + file);
        });
    });
};

dump('https://api.sansekai.my.id/api/flickreels/latest', 'flickreels.json');
dump('https://api.sansekai.my.id/api/freereels/homepage', 'freereels.json');
