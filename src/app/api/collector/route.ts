import { NextResponse } from 'next/server';
import { collectDramaBoxData } from '@/services/collector';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as any) || 'latest';

    // Security: In production, add a secret token check here
    // if (searchParams.get('token') !== process.env.COLLECTOR_TOKEN) return ...

    const result = await collectDramaBoxData(type);

    if (result.success) {
        return NextResponse.json({
            message: `Aggregation successful for ${type}`,
            count: result.count
        });
    } else {
        return NextResponse.json({
            error: "Aggregation failed",
            details: result.error
        }, { status: 500 });
    }
}
