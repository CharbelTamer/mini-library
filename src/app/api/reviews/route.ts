import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = reviewSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { bookId, rating, comment } = result.data;

  const review = await prisma.review.upsert({
    where: { bookId_userId: { bookId, userId: session.user.id } },
    update: { rating, comment },
    create: { bookId, userId: session.user.id, rating, comment },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(review);
}
