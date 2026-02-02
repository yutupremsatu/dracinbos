const fs = require('fs');

const run = () => {
    try {
        const html = fs.readFileSync('netshort_dump.html', 'utf8');
        console.log(`HTML Length: ${html.length}`);

        // Common hydration patterns
        const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*(\{.*?\})/s,
            /window\.__NUXT__\s*=\s*(\{.*?\})/s,
            /window\.__NEXT_DATA__\s*=\s*(\{.*?\})/s,
            /var\s+__\w+\s*=\s*(\{.*?\})/s,
            /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
            /JSON\.parse\('(.*?)'\)/s
        ];

        let found = false;
        for (const p of patterns) {
            const match = html.match(p);
            if (match) {
                console.log(`Found Match for pattern: ${p}`);
                console.log(`Preview: ${match[1].substring(0, 200)}...`);
                found = true;

                // Try to parse if it looks like JSON
                try {
                    const json = JSON.parse(match[1]);
                    console.log('Valid JSON parsed!');
                    fs.writeFileSync('netshort_hydration.json', JSON.stringify(json, null, 2));
                    console.log('Saved to netshort_hydration.json');
                } catch {
                    console.log('Could not parse JSON directly (might be JS object or escaped strings)');
                }
            }
        }

        if (!found) {
            console.log('No obvious hydration patterns found.');
            // Dump all script tags to see what's going on
            const scripts = html.match(/<script.*?>.*?<\/script>/gs);
            if (scripts) {
                console.log(`Found ${scripts.length} script tags.`);
                scripts.forEach((s, i) => {
                    if (s.length > 500) console.log(`Script ${i} length: ${s.length} - ${s.substring(0, 100)}...`);
                });
            }
        }

    } catch (e) {
        console.log('Error:', e.message);
    }
};
run();
