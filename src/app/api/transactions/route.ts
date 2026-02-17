import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;
  const status = searchParams.get("status");

  const role = session.user.role;
  if (userId !== session.user.id && role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, author: true, coverImage: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookId, userId, dueDate } = body;

  const targetUserId = userId || session.user.id;

  if (targetUserId !== session.user.id) {
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "LIBRARIAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  if (book.availableCopies <= 0) {
    return NextResponse.json({ error: "No copies available" }, { status: 400 });
  }

  const existingActive = await prisma.transaction.findFirst({
    where: { bookId, userId: targetUserId, status: "ACTIVE" },
  });
  if (existingActive) {
    return NextResponse.json({ error: "User already has this book checked out" }, { status: 400 });
  }

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        bookId,
        userId: targetUserId,
        dueDate: new Date(dueDate),
        status: "ACTIVE",
      },
      include: {
        book: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json(transaction, { status: 201 });
}
