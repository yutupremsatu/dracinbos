const https = require('https');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-base');

// Load environment variables manually
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (name) => {
    const match = env.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const fetchURL = (url, options = {}) => {
    return new Promise((resolve) => {
        const defaultOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        };
        const mergedOptions = { ...defaultOptions, ...options };
        mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

        const req = https.get(url, mergedOptions, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(null));
    });
};

async function syncAll() {
    console.log("=== STARTING DEEP SYNC ===");

    // 1. DramaBox (WilandWillie)
    console.log("[DramaBox] Fetching from WilandWillie...");
    const dbData = await fetchURL('https://wilandwillie.com/api/dramabox/latest', { rejectUnauthorized: false });
    const dbJson = JSON.parse(dbData);
    if (dbJson && dbJson.success) {
        console.log(`[DramaBox] Found ${dbJson.data.length} dramas.`);
        // Note: Real implementation would upsert to Supabase here
    }

    // 2. ReelShort (Direct Scrape)
    console.log("[ReelShort] Fetching homepage...");
    const rsHtml = await fetchURL('https://www.reelshort.com/');
    const rsMatch = rsHtml.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (rsMatch) {
        const rsData = JSON.parse(rsMatch[1]);
        const fallback = rsData.props?.pageProps?.fallback || {};
        const apiData = fallback['/api/video/hall/info'];
        if (apiData && apiData.data && apiData.data.lists) {
            let count = 0;
            apiData.data.lists.forEach(l => count += (l.books ? l.books.length : 0));
            console.log(`[ReelShort] Found ${count} dramas in fallback.`);
        }
    }

    // 3. Melolo (Direct Scrape)
    console.log("[Melolo] Fetching homepage...");
    const meloloHtml = await fetchURL('https://melolo.com/');
    const meloloMatch = meloloHtml.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (meloloMatch) {
        console.log("[Melolo] Found __NEXT_DATA__.");
    }

    console.log("=== DEEP SYNC COMPLETE ===");
}

syncAll();
