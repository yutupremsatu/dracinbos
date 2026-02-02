const https = require('https');

const url = 'https://kbcchztwbczadhpkwonm.supabase.co/rest/v1/dramas?platform=eq.reelshort&select=title,platform&limit=5';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            console.log("ReelShort Data:", data);
        } catch (e) {
            console.log("Error:", e);
        }
    });
}).on('error', (err) => {
    console.error("Error: " + err.message);
});
