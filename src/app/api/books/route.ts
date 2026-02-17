import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "";
  const available = searchParams.get("available");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
      { genre: { contains: query, mode: "insensitive" } },
    ];
  }

  if (genre) {
    where.genre = { equals: genre, mode: "insensitive" };
  }

  if (available === "true") {
    where.availableCopies = { gt: 0 };
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reviews: { select: { rating: true } },
        _count: { select: { transactions: true, reservations: true } },
      },
    }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({
    books,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = bookSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const data = result.data;
  const book = await prisma.book.create({
    data: {
      ...data,
      availableCopies: data.totalCopies,
      coverImage: data.coverImage || null,
      isbn: data.isbn || null,
      description: data.description || null,
      genre: data.genre || null,
      publisher: data.publisher || null,
      publishedYear: data.publishedYear || null,
      pageCount: data.pageCount || null,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
