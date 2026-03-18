import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Fetch knowledge and rules from Convex
  const [knowledge, rules] = await Promise.all([
    convex.query(api.settings.get, { key: "knowledge" }),
    convex.query(api.settings.get, { key: "rules" }),
  ]);

  const source: "knowledge_base" | "none" = knowledge ? "knowledge_base" : "none";

  const systemPrompt = `You are an AI assistant for an online marketing coaching business.

${knowledge ? `## Your Knowledge Base\n${knowledge}` : ""}

${rules ? `## Response Rules\n${rules}` : ""}

Always be helpful, professional, and focused on online marketing topics. Base your answers on the knowledge and rules provided above.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response type" }, { status: 500 });
  }

  return NextResponse.json({ content: content.text, source });
}
