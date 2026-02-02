const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const run = async () => {
    try {
        const raw = fs.readFileSync('netshort_full_state.json', 'utf8');
        const state = JSON.parse(raw);

        console.log('Loaded state. Searching for dramas...');

        let dramas = [];
        const seenIds = new Set();

        // Recursive find for objects with bookId/bookName or equivalent
        // NetShort might use: shortPlayId, shortPlayName, etc.
        const findDramas = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            // Check for NetShort patterns (based on previous inspection)
            if (obj.shortPlayId && obj.shortPlayName) {
                // Try to normalize
                const id = obj.shortPlayId.toString();
                if (!seenIds.has(id)) {
                    dramas.push({
                        id: id,
                        title: obj.shortPlayName,
                        cover: obj.cover || obj.coverH || obj.coverWap,
                        desc: obj.introduction || obj.desc
                    });
                    seenIds.add(id);
                }
            } else if (obj.bookId && obj.bookName) {
                const id = obj.bookId.toString();
                if (!seenIds.has(id)) {
                    dramas.push({
                        id: id,
                        title: obj.bookName,
                        cover: obj.cover || obj.coverWap,
                        desc: obj.introduction
                    });
                    seenIds.add(id);
                }
            }

            if (Array.isArray(obj)) {
                obj.forEach(i => findDramas(i));
            } else {
                Object.values(obj).forEach(v => findDramas(v));
            }
        };

        findDramas(state);

        console.log(`Found ${dramas.length} potential dramas.`);

        // Batch Upsert
        const BATCH_SIZE = 50;
        for (let i = 0; i < dramas.length; i += BATCH_SIZE) {
            const batch = dramas.slice(i, i + BATCH_SIZE);
            const upserts = batch.map(d => ({
                platform_id: `netshort-${d.id}`,
                platform: 'netshort',
                title: d.title,
                cover_url: d.cover,
                description: d.desc ? d.desc.substring(0, 500) : null
            }));

            const { error } = await supabase.from('dramas').upsert(upserts, { onConflict: 'platform_id' });
            if (error) console.error('Upsert Error:', error);
            else console.log(`Upserted batch ${i}-${i + batch.length}`);
        }

    } catch (e) {
        console.error('Error:', e);
    }
};

run();
