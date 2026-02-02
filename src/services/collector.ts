import { supabase } from '@/lib/supabase';

const DRAMABOX_API = "https://imgcdnmi.dramaboxdb.com/api"; // Example placeholder, actual logic uses direct fetching

export async function collectDramaBoxData(type: 'foryou' | 'latest' | 'trending') {
    console.log(`[Collector] Starting DramaBox collection for: ${type}`);

    try {
        // 1. Fetch from Source (For now, we use a hybrid approach or direct simulation)
        // NOTE: In a full aggregator, we'd use fetch with specific headers/signatures here.
        const response = await fetch(`https://api.sansekai.my.id/api/dramabox/${type}`);
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid data format from source");
        }

        const dramas = data.filter((item: any) => item.bookId);

        // 2. Prepare for Supabase
        const upsertData = dramas.map(drama => ({
            platform_id: `dramabox-${drama.bookId}`,
            platform: 'dramabox',
            title: drama.bookName,
            description: drama.introduction || drama.description,
            cover_url: drama.coverH || drama.coverWap || drama.cover || drama.coverV || drama.book_pic || drama.thumb_url,
            category: drama.categoryName,
            tags: Array.isArray(drama.tags) ? drama.tags : (typeof drama.tags === 'string' && drama.tags ? drama.tags.split(',') : []),
            total_episodes: drama.totalChapter || drama.episodeCount,
            status: drama.isFinished ? 'completed' : 'ongoing',
            updated_at: new Date().toISOString()
        }));

        // 3. Upsert into Supabase
        const { error } = await supabase
            .from('dramas')
            .upsert(upsertData, { onConflict: 'platform_id' });

        if (error) throw error;

        console.log(`[Collector] Successfully collected ${upsertData.length} dramas from DramaBox`);
        return { success: true, count: upsertData.length };
    } catch (error) {
        console.error(`[Collector] Error collecting DramaBox data:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function collectReelShortData() {
    console.log(`[Collector] Starting ReelShort collection`);

    try {
        const response = await fetch(`https://api.sansekai.my.id/api/reelshort/homepage`);
        const result = await response.json();

        // Handle response wrapper { success: true, data: { ... } }
        // Based on quick-check, response might be direct object or wrapped.
        // Let's safe guess based on types: data.lists -> [...]
        const data = result.data || result;

        if (!data || !data.lists) {
            console.error("Invalid ReelShort data structure:", JSON.stringify(result).substring(0, 200));
            throw new Error("Invalid data format from source");
        }

        let dramas: any[] = [];

        // 1. Collect from Lists
        if (Array.isArray(data.lists)) {
            data.lists.forEach((list: any) => {
                if (Array.isArray(list.books)) {
                    dramas.push(...list.books);
                }
            });
        }

        // 2. Collect from Banners (if applicable, structure varies so cautious here)
        // Ignoring banners for now to avoid specific "jump_param" complexity unless standard "book" structure matches.

        // Deduplicate by book_id
        dramas = Array.from(new Map(dramas.map(item => [item.book_id, item])).values());

        // 3. Prepare for Supabase
        const upsertData = dramas.map(drama => ({
            platform_id: `reelshort-${drama.book_id}`,
            platform: 'reelshort',
            title: drama.book_title || drama.book_name,
            description: drama.special_desc || drama.introduction || "No description",
            cover_url: drama.book_pic || drama.cover,
            category: "General", // ReelShort doesn't easy expose category in list
            tags: drama.theme || [], // ReelShort uses 'theme' as tags
            total_episodes: drama.chapter_count || 0,
            status: 'ongoing', // Defaulting as specific status is hard to determine from list
            updated_at: new Date().toISOString()
        }));

        if (upsertData.length === 0) {
            console.log(`[Collector] No valid dramas found for ReelShort`);
            return { success: true, count: 0 };
        }

        // 4. Upsert into Supabase
        const { error } = await supabase
            .from('dramas')
            .upsert(upsertData, { onConflict: 'platform_id' });

        if (error) throw error;

        console.log(`[Collector] Successfully collected ${upsertData.length} dramas from ReelShort`);
        return { success: true, count: upsertData.length };
    } catch (error) {
        console.error(`[Collector] Error collecting ReelShort data:`, error);
        return { success: false, error: (error as Error).message };
    }
}
