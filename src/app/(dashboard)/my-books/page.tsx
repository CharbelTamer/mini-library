"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookCheck, Loader2, AlertTriangle } from "lucide-react";
import { formatDate, isOverdue, getDaysUntilDue } from "@/lib/utils";

interface Transaction {
  id: string;
  checkoutDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverImage?: string | null;
  };
}

export default function MyBooksPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);

  const fetchTransactions = async () => {
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleReturn = async (transactionId: string) => {
    setReturning(transactionId);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" }),
      });
      if (!res.ok) throw new Error("Failed to return");
      toast.success("Book returned!");
      fetchTransactions();
    } catch {
      toast.error("Failed to return book");
    } finally {
      setReturning(null);
    }
  };

  const active = transactions.filter((t) => t.status === "ACTIVE");
  const overdue = active.filter((t) => isOverdue(t.dueDate));
  const returned = transactions.filter((t) => t.status === "RETURNED");

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Books</h1>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const TransactionCard = ({ t }: { t: Transaction }) => {
    const overdue = t.status === "ACTIVE" && isOverdue(t.dueDate);
    const daysLeft = t.status === "ACTIVE" ? getDaysUntilDue(t.dueDate) : null;

    return (
      <Card className={overdue ? "border-destructive" : ""}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
            {t.book.coverImage ? (
              <img src={t.book.coverImage} alt={t.book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">{t.book.title[0]}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <a href={`/books/${t.book.id}`} className="font-medium hover:underline truncate block">{t.book.title}</a>
            <p className="text-sm text-muted-foreground">{t.book.author}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Checked out: {formatDate(t.checkoutDate)}</span>
              {t.status === "ACTIVE" && (
                <span className={overdue ? "text-destructive font-medium" : ""}>
                  Due: {formatDate(t.dueDate)}
                  {daysLeft !== null && (overdue ? ` (${Math.abs(daysLeft)} days overdue)` : ` (${daysLeft} days left)`)}
                </span>
              )}
              {t.returnDate && <span>Returned: {formatDate(t.returnDate)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {overdue && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {t.status === "ACTIVE" ? (
              <Button size="sm" onClick={() => handleReturn(t.id)} disabled={returning === t.id}>
                {returning === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookCheck className="h-4 w-4 mr-1" />}
                Return
              </Button>
            ) : (
              <Badge variant="secondary">Returned</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Books</h1>
        <p className="text-muted-foreground">
          Manage your borrowed books, {session?.user?.name}
        </p>
      </div>

      {overdue.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              You have {overdue.length} overdue book{overdue.length > 1 ? "s" : ""}. Please return them as soon as possible.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({returned.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {active.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <BookCheck className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium">No active checkouts</p>
                <p className="text-sm text-muted-foreground">Browse the catalog to check out some books!</p>
                <a href="/catalog"><Button className="mt-4">Browse Catalog</Button></a>
              </CardContent>
            </Card>
          ) : (
            active.map((t) => <TransactionCard key={t.id} t={t} />)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {returned.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No return history yet
              </CardContent>
            </Card>
          ) : (
            returned.map((t) => <TransactionCard key={t.id} t={t} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
