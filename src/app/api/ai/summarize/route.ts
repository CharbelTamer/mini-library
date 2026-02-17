import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, author, isbn } = await req.json();

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Write a compelling 2-3 sentence book description for a library catalog entry.

Book: "${title}" by ${author}${isbn ? ` (ISBN: ${isbn})` : ""}

The description should be engaging and informative, mentioning the genre, themes, and what makes this book notable. Keep it concise and suitable for a library catalog.`,
  });

  return NextResponse.json({ summary: text });
}
