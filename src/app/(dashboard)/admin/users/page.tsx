"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface UserData {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: string;
  createdAt: string;
  _count: { transactions: number; reviews: number };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      redirect("/");
    }
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [session]);

  const updateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
        toast.success("Role updated!");
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const roleBadgeVariant = {
    ADMIN: "destructive" as const,
    LIBRARIAN: "default" as const,
    MEMBER: "secondary" as const,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground">{users.length} registered users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 border-b pb-4 last:border-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(user.createdAt)} &middot; {user._count.transactions} checkouts &middot; {user._count.reviews} reviews
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={roleBadgeVariant[user.role as keyof typeof roleBadgeVariant] || "secondary"}>
                    {user.role}
                  </Badge>
                  {user.id !== session?.user?.id && (
                    <Select value={user.role} onValueChange={(v) => updateRole(user.id, v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="LIBRARIAN">Librarian</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
