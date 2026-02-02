import { supabase } from "@/lib/supabase";
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return encryptedResponse([]);
  }

  try {
    const { data, error } = await supabase
      .from('dramas')
      .select('*')
      .eq('platform', 'dramabox')
      .ilike('title', `%${query}%`)
      .limit(50);

    if (error) {
      console.error("Supabase Search Error:", error);
      throw error;
    }

    const mappedData = data.map(drama => ({
      bookId: drama.platform_id.replace('dramabox-', ''),
      bookName: drama.title,
      coverWap: drama.cover_url,
      cover: drama.cover_url,
      chapterCount: drama.total_episodes,
      introduction: drama.description,
      tags: drama.tags || [],
      corner: (new Date(drama.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
        ? { name: 'New', color: '#E11D48' }
        : null
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

