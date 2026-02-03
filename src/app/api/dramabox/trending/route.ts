import { supabase } from "@/lib/supabase";
import { encryptedResponse } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') || 'dramabox';

  try {
    const { data, error } = await supabase
      .from('dramas')
      .select('*')
      .eq('platform', platform)
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .limit(50); // Fetch more to shuffle

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // Random shuffle for "Trending" simulation
    const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 20);

    const mappedData = shuffled.map(drama => ({
      bookId: drama.platform_id.replace(`${drama.platform}-`, ''),
      bookName: drama.title,
      platform: drama.platform,
      coverWap: drama.cover_url,
      cover: drama.cover_url,
      chapterCount: drama.total_episodes,
      introduction: drama.description,
      tags: drama.tags || [],
      corner: { name: 'Hot', color: '#E5A00D' }
    }));

    return encryptedResponse(mappedData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

