const https = require('https');

const fetchURL = (url, options = {}, postData = null) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch (e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (postData) req.write(JSON.stringify(postData));
        req.end();
    });
};

async function testDramaBox() {
    try {
        console.log("Fetching token...");
        const tokenRes = await fetchURL("https://dramabox-token.vercel.app/token");
        const { token, deviceid } = tokenRes.body;

        const url = "https://sapi.dramaboxdb.com/drama-box/search/suggest";
        const options = {
            method: 'POST',
            headers: {
                "User-Agent": "okhttp/4.10.0",
                "tn": `Bearer ${token}`,
                "device-id": deviceid,
                "version": "430",
                "vn": "4.3.0",
                "cid": "DRA1000042",
                "language": "in",
                "current-language": "in",
                "time-zone": "+0800",
                "Content-Type": "application/json"
            }
        };

        const postData = {
            keyword: "a", // Generic search
        };

        console.log("Fetching dramas from DramaBox API...");
        const result = await fetchURL(url, options, postData);
        console.log("Response Status:", result.status);
        console.log("Response Body:", JSON.stringify(result.body).substring(0, 1000));

        const list = result.body?.data?.suggestList || [];
        console.log(`Found ${list.length} dramas.`);
    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

testDramaBox();
