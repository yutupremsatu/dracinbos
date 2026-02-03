import { supabase } from '@/lib/supabase';

// Helper to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function repairMeloloCovers(limit: number = 5) {
    console.log(`[Repair] Starting Melolo cover repair (Limit: ${limit})...`);

    // 1. Get candidates
    const { data: candidates, error } = await supabase
        .from('dramas')
        .select('platform_id, title')
        .eq('platform', 'melolo')
        .or('cover_url.is.null,cover_url.eq.""')
        .limit(limit);

    if (error) {
        console.error("[Repair] Failed to fetch candidates:", error);
        return { success: false, error };
    }

    if (!candidates || candidates.length === 0) {
        console.log("[Repair] No Melolo items need repair.");
        return { success: true, count: 0 };
    }

    console.log(`[Repair] Found ${candidates.length} items to fix.`);
    let fixed = 0;

    for (const item of candidates) {
        try {
            // ID format: melolo-drama-slug
            const slug = item.platform_id.replace('melolo-', '');
            const url = `https://melolo.com/dramas/${slug}`;

            console.log(`[Repair] Fetching: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            if (!response.ok) {
                console.warn(`[Repair] Failed to fetch ${slug}: ${response.status}`);
                continue;
            }

            const html = await response.text();

            // Regex hunt for cover
            // Pattern 1: og:image
            let cover = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];

            // Pattern 2: twitter:image
            if (!cover) cover = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];

            // Pattern 3: direct img look (risky depending on layout)
            if (!cover) cover = html.match(/class="book-cover"[^>]*src="([^"]+)"/)?.[1];

            if (cover) {
                console.log(`[Repair] Found cover for ${item.title}: ${cover}`);

                const { error: updateError } = await supabase
                    .from('dramas')
                    .update({ cover_url: cover, updated_at: new Date().toISOString() })
                    .eq('platform_id', item.platform_id);

                if (!updateError) fixed++;
                else console.error(`[Repair] Update failed:`, updateError);
            } else {
                console.warn(`[Repair] No cover found in HTML for ${slug}`);
            }

            // Chill for a bit to be nice to Melolo
            await wait(2000);

        } catch (err) {
            console.error(`[Repair] Error processing ${item.title}:`, err);
        }
    }

    return { success: true, count: fixed, total_attempted: candidates.length };
}
