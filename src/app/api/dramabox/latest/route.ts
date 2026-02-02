import { supabase } from "@/lib/supabase";
import { encryptedResponse } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dramas')
      .select('*')
      .eq('platform', 'dramabox')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase Error:", error);
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
      corner: { name: 'New', color: '#E11D48' }
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

