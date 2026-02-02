import { NextResponse } from 'next/server';
import { collectDramaBoxData, collectReelShortData } from '@/services/collector';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as any) || 'latest'; // For DramaBox
    const platform = searchParams.get('platform') || 'dramabox';

    // Security: In production, add a secret token check here
    // if (searchParams.get('token') !== process.env.COLLECTOR_TOKEN) return ...

    let result;

    if (platform === 'reelshort') {
        result = await collectReelShortData();
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
