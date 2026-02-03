import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Redirect to home after successful OAuth
    return NextResponse.redirect(`${origin}/`);
}
