const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Hardcoded creds for script execution
const supabaseUrl = 'https://kbcchztwbczadhpkwonm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';
const supabase = createClient(supabaseUrl, supabaseKey);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchHTML = (url) => {
    return new Promise((resolve) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ ok: res.statusCode === 200, text: data, status: res.statusCode }));
        });
        req.on('error', (e) => resolve({ ok: false, error: e.message }));
    });
};

async function repair() {
    console.log("--- Manual Melolo Repair ---");

    // Get 5 candidates
    const { data: candidates, error } = await supabase
        .from('dramas')
        .select('platform_id, title')
        .eq('platform', 'melolo')
        .or('cover_url.is.null,cover_url.eq.""')
        .limit(5);

    if (error || !candidates.length) {
        console.log("No items to repair.");
        return;
    }

    console.log(`Found ${candidates.length} items to fix.`);

    for (const item of candidates) {
        const slug = item.platform_id.replace('melolo-', '');
        const url = `https://melolo.com/dramas/${slug}`;
        console.log(`Fetching: ${item.title} (${url})...`);

        const res = await fetchHTML(url);

        if (res.ok) {
            const html = res.text;
            let cover = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
            if (!cover) cover = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];

            if (cover) {
                console.log(`   ✅ Found Cover: ${cover}`);
                await supabase.from('dramas').update({ cover_url: cover }).eq('platform_id', item.platform_id);
            } else {
                console.log("   ❌ No cover found in HTML.");
            }
        } else {
            console.log(`   ⚠️ Failed: ${res.status || res.error}`);
        }

        await wait(2000);
    }
}

repair();
