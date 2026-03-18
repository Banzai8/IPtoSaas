import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const chatPassword = await convex.query(api.settings.get, { key: "chatPassword" });

  if (!chatPassword) {
    return NextResponse.json({ error: "Chat password not set" }, { status: 500 });
  }

  if (password === chatPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
