import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalBooks,
    totalUsers,
    activeCheckouts,
    overdueCount,
    recentTransactions,
    genreCounts,
    monthlyCheckouts,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.transaction.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({
      where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    }),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        book: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.book.groupBy({
      by: ["genre"],
      _count: true,
      where: { genre: { not: null } },
      orderBy: { _count: { genre: "desc" } },
      take: 8,
    }),
    prisma.transaction.groupBy({
      by: ["checkoutDate"],
      _count: true,
      where: {
        checkoutDate: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
    }),
  ]);

  const monthlyData = monthlyCheckouts.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: Record<string, number>, t: any) => {
      const month = new Date(t.checkoutDate).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      acc[month] = (acc[month] || 0) + t._count;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    totalBooks,
    totalUsers,
    activeCheckouts,
    overdueCount,
    recentTransactions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    genreCounts: genreCounts.map((g: any) => ({
      genre: g.genre || "Unknown",
      count: g._count,
    })),
    monthlyCheckouts: Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    })),
  });
}
