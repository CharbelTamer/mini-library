"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  activeCheckouts: number;
  overdueCount: number;
  recentTransactions: {
    id: string;
    status: string;
    createdAt: string;
    book: { title: string };
    user: { name: string | null };
  }[];
  genreCounts: { genre: string; count: number }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Books", value: stats?.totalBooks || 0, icon: BookOpen, color: "text-blue-500" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-green-500" },
    { label: "Active Checkouts", value: stats?.activeCheckouts || 0, icon: ArrowRightLeft, color: "text-orange-500" },
    { label: "Overdue", value: stats?.overdueCount || 0, icon: AlertTriangle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "User"}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{t.book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {t.user.name || "Unknown"} &middot; {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <Badge variant={t.status === "ACTIVE" ? "default" : t.status === "RETURNED" ? "secondary" : "destructive"}>
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books by Genre</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.genreCounts && stats.genreCounts.length > 0 ? (
              <div className="space-y-3">
                {stats.genreCounts.map((g) => (
                  <div key={g.genre} className="flex items-center justify-between">
                    <span className="text-sm">{g.genre}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(g.count * 15, 200)}px` }} />
                      <span className="text-sm text-muted-foreground">{g.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No genre data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
