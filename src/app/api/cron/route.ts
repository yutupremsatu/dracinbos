import { NextResponse } from 'next/server';
import {
    collectDramaBoxData,
    collectReelShortData,
    collectNetShortData,
    collectMeloloData,
    collectFlickReelsData,
    collectFreeReelsData
} from '@/services/collector';
import { repairMeloloCovers } from '@/services/repair';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cron] Starting automated daily sync...');
        const results: Record<string, any> = {};

        // 1. DramaBox
        console.log('[Cron] Syncing DramaBox...');
        results['dramabox_latest'] = await collectDramaBoxData('latest');
        results['dramabox_trending'] = await collectDramaBoxData('trending');

        // 2. ReelShort
        console.log('[Cron] Syncing ReelShort...');
        results['reelshort'] = await collectReelShortData();

        // 3. NetShort
        console.log('[Cron] Syncing NetShort...');
        results['netshort'] = await collectNetShortData();

        // 4. Melolo
        console.log('[Cron] Syncing Melolo...');
        results['melolo'] = await collectMeloloData();

        // 5. FlickReels
        console.log('[Cron] Syncing FlickReels...');
        results['flickreels'] = await collectFlickReelsData();

        // 6. FreeReels
        console.log('[Cron] Syncing FreeReels...');
        results['freereels'] = await collectFreeReelsData();

        // 7. Repair (Slow Fetch Melolo)
        console.log('[Cron] Running Melolo Repair...');
        results['melolo_repair'] = await repairMeloloCovers(10);

        console.log('[Cron] Daily sync completed.', results);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('[Cron] Critical failure:', error);
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
