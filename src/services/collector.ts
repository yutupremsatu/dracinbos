import { supabase } from '@/lib/supabase';

const DRAMABOX_API = "https://imgcdnmi.dramaboxdb.com/api";
const API_BASE_URL = "https://api.sansekai.my.id";
const WILANDWILLIE_BASE = "https://wilandwillie.com/api";

// For debugging fetch failures in restricted environments
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function collectDramaBoxData(type: 'foryou' | 'latest' | 'trending') {
    console.log(`[Collector] Starting DramaBox collection (${type})`);

    try {
        // Primary source: wilandwillie (working)
        let response = await fetch(`${WILANDWILLIE_BASE}/dramabox/${type}`);
        let result = await response.json();
        let dramas: any[] = [];

        if (result.success && Array.isArray(result.data)) {
            dramas = result.data;
        } else {
            // Fallback 1: Sansekai (current 403, but maybe token works)
            console.log("[Collector] WilandWillie failed, trying Sansekai...");
            response = await fetch(`${API_BASE_URL}/api/dramabox/${type}`, {
                headers: { 'Authorization': 'Sansekai-SekaiDrama' }
            });
            if (response.ok) {
                dramas = await response.json();
            }
        }

        if (dramas.length === 0) {
            return { success: false, error: "No data found from any source" };
        }

        const upsertData = dramas.map(drama => ({
            platform_id: `dramabox-${drama.bookId || drama.id}`,
            platform: 'dramabox',
            title: drama.bookName || drama.title,
            description: drama.introduction || drama.description || "No description",
            cover_url: drama.coverH || drama.coverWap || drama.cover || drama.thumb_url,
            category: drama.categoryName || "General",
            tags: Array.isArray(drama.tags) ? drama.tags : [],
            total_episodes: drama.totalChapter || drama.episodeCount || 0,
            status: drama.isFinished ? 'completed' : 'ongoing',
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('dramas').upsert(upsertData, { onConflict: 'platform_id' });
        if (error) throw error;

        return { success: true, count: upsertData.length };
    } catch (error) {
        console.error(`[Collector] DramaBox collection failed:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function collectReelShortData() {
    console.log(`[Collector] Starting ReelShort collection (Direct Web Scrape)`);

    try {
        // Fallback to direct web scrape
        const webResponse = await fetch(`https://www.reelshort.com/`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await webResponse.text();
        // Extract data from __NEXT_DATA__ or similar JSON in script tags
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        let dramas: any[] = [];

        if (match) {
            const nextData = JSON.parse(match[1]);
            const fallback = nextData.props?.pageProps?.fallback || {};
            const apiData = fallback['/api/video/hall/info'];

            if (apiData && apiData.data && Array.isArray(apiData.data.lists)) {
                apiData.data.lists.forEach((list: any) => {
                    if (Array.isArray(list.books)) {
                        dramas.push(...list.books);
                    }
                });
            }
        }

        // Deduplicate
        dramas = Array.from(new Map(dramas.map(item => [item.book_id, item])).values())
            .filter(item => item.book_id && (item.book_title || item.book_name));

        if (dramas.length === 0) {
            console.log("[Collector] ReelShort website failed, trying Sansekai fallback...");
            const response = await fetch(`${API_BASE_URL}/api/reelshort/homepage`);
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                if (data && Array.isArray(data.lists)) {
                    data.lists.forEach((list: any) => {
                        if (Array.isArray(list.books)) dramas.push(...list.books);
                    });
                }
            }
        }

        const upsertData = dramas.map(drama => ({
            platform_id: `reelshort-${drama.book_id}`,
            platform: 'reelshort',
            title: drama.book_title || drama.book_name,
            description: drama.introduction || drama.book_desc || "No description",
            cover_url: drama.book_pic || drama.cover_url || drama.cover_pic,
            category: "General",
            tags: drama.theme_list ? drama.theme_list.map((t: any) => t.theme_name) : [],
            total_episodes: drama.chapter_count || drama.episode_count || 0,
            status: drama.serialize_status === 1 ? 'completed' : 'ongoing',
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('dramas').upsert(upsertData, { onConflict: 'platform_id' });
        if (error) throw error;

        return { success: true, count: upsertData.length };
    } catch (error) {
        console.error(`[Collector] ReelShort collection failed:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function collectNetShortData() {
    console.log(`[Collector] Starting NetShort collection (Direct API)`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/netshort/foryou`);
        if (!response.ok) throw new Error(`NetShort API returned ${response.status}`);

        const result = await response.json();
        const data = result.data || result;

        if (!data || !data.contentInfos) {
            console.error("Invalid NetShort data structure:", JSON.stringify(result).substring(0, 200));
            throw new Error("Invalid NetShort data format");
        }

        const dramas = data.contentInfos.map((item: any) => ({
            platform_id: `netshort-${item.shortPlayId}`,
            platform: 'netshort',
            title: item.shortPlayName,
            description: item.scriptName || `Hot: ${item.heatScoreShow}`,
            cover_url: item.shortPlayCover,
            category: item.labelArray && item.labelArray.length > 0 ? item.labelArray[0] : "General",
            tags: item.labelArray || [],
            total_episodes: 0,
            status: 'ongoing',
            updated_at: new Date().toISOString()
        }));

        if (dramas.length > 0) {
            const { error } = await supabase
                .from('dramas')
                .upsert(dramas, { onConflict: 'platform_id' });
            if (error) {
                console.error(`[Collector] Error upserting NetShort dramas:`, error);
                throw error;
            }
        }

        console.log(`[Collector] Successfully processed ${dramas.length} NetShort dramas`);
        return { success: true, count: dramas.length };
    } catch (error) {
        console.error(`[Collector] NetShort collection failed:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function collectMeloloData() {

    try {
        const response = await fetch(`${API_BASE_URL}/api/melolo/latest`);
        const result = await response.json();

        // Structure check based on dump: { code: 200, message: "OK", data: { books: [...] } }
        const books = result.data?.books || [];

        if (!Array.isArray(books)) {
            console.error("Invalid Melolo data structure:", JSON.stringify(result).substring(0, 200));
            throw new Error("Invalid Melolo data format");
        }

        const dramas = books.map((item: any) => ({
            platform_id: `melolo-${item.book_id}`,
            platform: 'melolo',
            title: item.book_name,
            description: item.abstract || item.book_name,
            cover_url: item.thumb_url,
            category: item.category_info || "General",
            tags: [], // Melolo dump didn't show explicit tags array in the items inspected, usually just category
            total_episodes: parseInt(item.chapter_count || '0'),
            updated_at: new Date().toISOString()
        }));

        console.log(`[Collector] Found ${dramas.length} items from Melolo`);

        const { error } = await supabase
            .from('dramas')
            .upsert(dramas, {
                onConflict: 'platform_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`[Collector] Error upserting Melolo dramas:`, error);
            throw error;
        }

        console.log(`[Collector] Successfully processed ${dramas.length} Melolo dramas`);
        return { success: true, count: dramas.length };
    } catch (error) {
        console.error(`[Collector] Melolo collection failed:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function collectFlickReelsData() {
    console.log(`[Collector] Starting FlickReels collection`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/flickreels/latest`);
        const result = await response.json();

        // Structure check based on dump: { status_code: 1, msg: "...", data: [ { list: [...] } ] }
        // Taking the first category list as 'latest' usually implies the main feed
        const list = result.data?.[0]?.list || [];

        if (!Array.isArray(list)) {
            console.error("Invalid FlickReels data structure:", JSON.stringify(result).substring(0, 200));
            throw new Error("Invalid FlickReels data format");
        }

        const dramas = list.map((item: any) => ({
            platform_id: `flickreels-${item.playlet_id}`,
            platform: 'flickreels',
            title: item.title,
            description: item.introduce || item.title, // 'introduce' was empty in dump, fall back to title
            cover_url: item.cover,
            category: "General",
            tags: item.playlet_tag_name || [],
            total_episodes: parseInt(item.upload_num || '0'),
            updated_at: new Date().toISOString()
        }));

        console.log(`[Collector] Found ${dramas.length} items from FlickReels`);

        const { error } = await supabase
            .from('dramas')
            .upsert(dramas, {
                onConflict: 'platform_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`[Collector] Error upserting FlickReels dramas:`, error);
            throw error;
        }

        console.log(`[Collector] Successfully processed ${dramas.length} FlickReels dramas`);
        return { success: true, count: dramas.length };
    } catch (error) {
        console.error(`[Collector] FlickReels collection failed:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function collectFreeReelsData() {
    console.log(`[Collector] Starting FreeReels collection`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/freereels/homepage`);
        const result = await response.json();

        // Structure check based on dump: { code: 200, message: "...", data: { items: [ { type: "...", items: [...] }, ... ] } }
        const modules = result.data?.items || [];

        if (!Array.isArray(modules)) {
            console.error("Invalid FreeReels data structure:", JSON.stringify(result).substring(0, 200));
            throw new Error("Invalid FreeReels data format");
        }

        let allDramas: any[] = [];

        // Iterate through all modules (column_vertical_three, recommend, etc.) and collect items
        for (const module of modules) {
            if (module.items && Array.isArray(module.items)) {
                allDramas = allDramas.concat(module.items);
            }
        }

        // Filter out items that might not be dramas (e.g., banners without keys or specific types if necessary)
        // Based on dump, items have 'key', 'title', 'cover'.
        const validItems = allDramas.filter((item: any) => item.key && item.title);

        // Deduplicate based on key just in case same drama appears in multiple modules
        const uniqueItemsMap = new Map();
        validItems.forEach((item: any) => {
            if (!uniqueItemsMap.has(item.key)) {
                uniqueItemsMap.set(item.key, item);
            }
        });

        const uniqueItems = Array.from(uniqueItemsMap.values());

        const dramas = uniqueItems.map((item: any) => ({
            platform_id: `freereels-${item.key}`,
            platform: 'freereels',
            title: item.title,
            description: item.desc || item.title,
            cover_url: item.cover,
            category: "General",
            tags: item.series_tag || item.content_tags || [],
            total_episodes: item.episode_count || 0,
            updated_at: new Date().toISOString()
        }));

        console.log(`[Collector] Found ${dramas.length} unique items from FreeReels`);

        const { error } = await supabase
            .from('dramas')
            .upsert(dramas, {
                onConflict: 'platform_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`[Collector] Error upserting FreeReels dramas:`, error);
            throw error;
        }

        console.log(`[Collector] Successfully processed ${dramas.length} FreeReels dramas`);
        return { success: true, count: dramas.length };
    } catch (error) {
        console.error(`[Collector] FreeReels collection failed:`, error);
        return { success: false, error: (error as Error).message };
    }
}
