import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const record = await convex.query(api.accessPasswords.getByPassword, { password });

  if (!record) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  if (record.expiryDate < today) {
    return NextResponse.json({ error: "Password has expired" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
