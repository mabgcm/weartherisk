import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  return NextResponse.json({ country }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
