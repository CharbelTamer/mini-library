import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;

  const reservations = await prisma.reservation.findMany({
    where: { userId, status: "PENDING" },
    include: {
      book: { select: { id: true, title: true, author: true, coverImage: true, availableCopies: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await req.json();

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  if (book.availableCopies > 0) {
    return NextResponse.json({ error: "Book is available, no need to reserve" }, { status: 400 });
  }

  const existing = await prisma.reservation.findFirst({
    where: { bookId, userId: session.user.id, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "Already reserved" }, { status: 400 });
  }

  const reservation = await prisma.reservation.create({
    data: {
      bookId,
      userId: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(reservation, { status: 201 });
}
