"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ArrowRightLeft, AlertTriangle, Download } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  activeCheckouts: number;
  overdueCount: number;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      redirect("/");
    }
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [session]);

  const exportCSV = async () => {
    const res = await fetch("/api/books?limit=1000");
    const data = await res.json();
    const books = data.books;

    const headers = ["Title", "Author", "ISBN", "Genre", "Publisher", "Year", "Total Copies", "Available Copies"];
    const rows = books.map((b: Record<string, unknown>) =>
      [b.title, b.author, b.isbn || "", b.genre || "", b.publisher || "", b.publishedYear || "", b.totalCopies, b.availableCopies].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "library-inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export Inventory
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Books", value: stats?.totalBooks || 0, icon: BookOpen, color: "text-blue-500" },
          { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-green-500" },
          { label: "Active Checkouts", value: stats?.activeCheckouts || 0, icon: ArrowRightLeft, color: "text-orange-500" },
          { label: "Overdue", value: stats?.overdueCount || 0, icon: AlertTriangle, color: "text-red-500" },
        ].map((stat) => (
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

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/users">
          <Card className="transition-colors hover:bg-accent cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all users, assign roles, and manage permissions
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/books/new">
          <Card className="transition-colors hover:bg-accent cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Add Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add new books to the library catalog with AI-powered metadata
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
