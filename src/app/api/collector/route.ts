import { NextResponse } from 'next/server';
import { collectDramaBoxData, collectReelShortData, collectNetShortData, collectMeloloData, collectFlickReelsData, collectFreeReelsData } from '@/services/collector';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as any) || 'latest'; // For DramaBox
    const platform = searchParams.get('platform') || 'dramabox';

    // Security: In production, add a secret token check here
    // if (searchParams.get('token') !== process.env.COLLECTOR_TOKEN) return ...

    if (platform === 'all') {
        const platforms = ['dramabox', 'reelshort', 'netshort', 'melolo', 'flickreels', 'freereels'];
        const results: any = {};
        let totalCount = 0;

        for (const p of platforms) {
            console.log(`[Collector] Syncing all: ${p}`);
            let res;
            if (p === 'reelshort') res = await collectReelShortData();
            else if (p === 'netshort') res = await collectNetShortData();
            else if (p === 'melolo') res = await collectMeloloData();
            else if (p === 'flickreels') res = await collectFlickReelsData();
            else if (p === 'freereels') res = await collectFreeReelsData();
            else res = await collectDramaBoxData('latest');

            results[p] = res;
            if (res.success) totalCount += res.count;
        }

        return NextResponse.json({
            message: "Bulk aggregation complete",
            totalCount,
            results
        });
    }

    let result;

    if (platform === 'reelshort') {
        result = await collectReelShortData();
    } else if (platform === 'netshort') {
        result = await collectNetShortData();
    } else if (platform === 'melolo') {
        result = await collectMeloloData();
    } else if (platform === 'flickreels') {
        result = await collectFlickReelsData();
    } else if (platform === 'freereels') {
        result = await collectFreeReelsData();
    } else {
        result = await collectDramaBoxData(type);
    }

    if (result.success) {
        return NextResponse.json({
            message: `Aggregation successful for ${platform} (${type})`,
            count: result.count
        });
    } else {
        return NextResponse.json({
            error: "Aggregation failed",
            details: result.error
        }, { status: 500 });
    }
}
