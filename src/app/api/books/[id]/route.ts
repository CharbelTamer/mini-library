import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { transactions: true, reservations: true } },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(book);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = bookSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const data = result.data;
  const checkedOut = existing.totalCopies - existing.availableCopies;
  const newAvailable = Math.max(0, data.totalCopies - checkedOut);

  const book = await prisma.book.update({
    where: { id },
    data: {
      ...data,
      availableCopies: newAvailable,
      coverImage: data.coverImage || null,
      isbn: data.isbn || null,
      description: data.description || null,
      genre: data.genre || null,
      publisher: data.publisher || null,
      publishedYear: data.publishedYear || null,
      pageCount: data.pageCount || null,
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.book.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
