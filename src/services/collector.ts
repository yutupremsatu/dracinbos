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
            cover_url: drama.coverH || drama.cover,
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
