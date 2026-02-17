import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [userTransactions, allBooks] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: { book: { select: { title: true, author: true, genre: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.book.findMany({
      where: { availableCopies: { gt: 0 } },
      select: { id: true, title: true, author: true, genre: true, description: true },
      take: 50,
    }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readBooks = userTransactions.map((t: any) => `"${t.book.title}" by ${t.book.author} (${t.book.genre || "General"})`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableBooks = allBooks.map((b: any) => `ID:${b.id} - "${b.title}" by ${b.author} (${b.genre || "General"}): ${b.description?.slice(0, 100) || "No description"}`);

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `You are a librarian AI. Based on the user's reading history, recommend 3-5 books from the available catalog.

User's reading history:
${readBooks.length > 0 ? readBooks.join("\n") : "No reading history yet - suggest popular diverse picks."}

Available books in our library:
${availableBooks.join("\n")}

Return your response as a JSON array with objects containing: "id" (the book ID), "title", "reason" (a short personalized explanation of why you recommend it).
Only return the JSON array, no other text.`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const recommendations = JSON.parse(cleaned);
    return NextResponse.json(recommendations);
  } catch {
    return NextResponse.json([]);
  }
}
