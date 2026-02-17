import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Convert this natural language library search query into structured search filters.
    
Query: "${query}"

Return a JSON object with these optional fields:
- "title": partial title match string
- "author": partial author match string  
- "genre": genre category string
- "availableOnly": boolean, true if user wants only available books

Only return the JSON object, nothing else.`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const filters = JSON.parse(cleaned);
    const where: Record<string, unknown> = {};

    if (filters.title) {
      where.title = { contains: filters.title, mode: "insensitive" };
    }
    if (filters.author) {
      where.author = { contains: filters.author, mode: "insensitive" };
    }
    if (filters.genre) {
      where.genre = { contains: filters.genre, mode: "insensitive" };
    }
    if (filters.availableOnly) {
      where.availableCopies = { gt: 0 };
    }

    if (Object.keys(where).length === 0) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { genre: { contains: query, mode: "insensitive" } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      take: 20,
      include: { reviews: { select: { rating: true } } },
    });

    return NextResponse.json({ books, filters });
  } catch {
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    });
    return NextResponse.json({ books, filters: {} });
  }
}
