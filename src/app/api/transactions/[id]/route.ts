import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { book: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (action === "return") {
    if (transaction.status === "RETURNED") {
      return NextResponse.json({ error: "Already returned" }, { status: 400 });
    }

    const role = session.user.role;
    if (
      transaction.userId !== session.user.id &&
      role !== "ADMIN" &&
      role !== "LIBRARIAN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id },
        data: { status: "RETURNED", returnDate: new Date() },
      }),
      prisma.book.update({
        where: { id: transaction.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
