import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages }: { messages: UIMessage[] } = await req.json();

  const books = await prisma.book.findMany({
    select: { title: true, author: true, genre: true, availableCopies: true, description: true },
    take: 100,
  });

  const catalogContext = books
    .map(
      (b: { title: string; author: string; genre: string | null; availableCopies: number }) =>
        `- "${b.title}" by ${b.author} (${b.genre || "General"}) - ${b.availableCopies > 0 ? "Available" : "Checked out"}`
    )
    .join("\n");

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `You are a helpful AI library assistant for "Mini Library", a modern library management system.
You help users find books, get recommendations, and answer questions about the library.
Be friendly, concise, and knowledgeable about literature.

Here is the current library catalog:
${catalogContext}

When recommending books, prioritize ones that are available. If a user asks about a book not in the catalog, let them know and suggest similar available books.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
