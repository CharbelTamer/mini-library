"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, Edit, Trash2, ArrowLeft, BookCheck, BookX, Loader2, CalendarIcon } from "lucide-react";
import { formatDate, isOverdue } from "@/lib/utils";

interface BookDetail {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  description?: string | null;
  coverImage?: string | null;
  genre?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  pageCount?: number | null;
  language: string;
  totalCopies: number;
  availableCopies: number;
  reviews: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    user: { id: string; name?: string | null; image?: string | null };
  }[];
  transactions: {
    id: string;
    status: string;
    dueDate: string;
    user: { id: string; name?: string | null };
  }[];
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "LIBRARIAN";

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then(setBook)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id, dueDate }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Book checked out!");
      setCheckoutOpen(false);
      router.refresh();
      const updated = await fetch(`/api/books/${id}`).then((r) => r.json());
      setBook(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async () => {
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Book reserved! You'll be notified when it's available.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reservation failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await fetch(`/api/books/${id}`, { method: "DELETE" });
      toast.success("Book deleted");
      router.push("/catalog");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleReview = async () => {
    if (rating === 0) return;
    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id, rating, comment: comment || null }),
      });
      if (res.ok) {
        toast.success("Review submitted!");
        const updated = await fetch(`/api/books/${id}`).then((r) => r.json());
        setBook(updated);
        setRating(0);
        setComment("");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="aspect-[2/3]" />
          <Skeleton className="lg:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  if (!book) {
    return <div className="text-center py-16"><p>Book not found</p></div>;
  }

  const avgRating = book.reviews.length > 0
    ? (book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length).toFixed(1)
    : null;

  const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">{book.title}</h1>
        {isStaff && (
          <div className="flex gap-2">
            <Link href={`/books/${id}/edit`}>
              <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
          {book.coverImage ? (
            <Image src={book.coverImage} alt={book.title} fill className="object-cover" sizes="33vw" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-bold text-primary/30">{book.title[0]}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={book.availableCopies > 0 ? "default" : "destructive"}>
                  {book.availableCopies > 0 ? `${book.availableCopies} of ${book.totalCopies} available` : "All copies checked out"}
                </Badge>
                {book.genre && <Badge variant="outline">{book.genre}</Badge>}
                {avgRating && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {avgRating} ({book.reviews.length})
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-lg font-medium">{book.author}</p>
                {book.publisher && <p className="text-sm text-muted-foreground">{book.publisher}{book.publishedYear ? `, ${book.publishedYear}` : ""}</p>}
              </div>

              {book.description && <p className="text-sm leading-relaxed">{book.description}</p>}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {book.isbn && <div><span className="text-muted-foreground">ISBN:</span> {book.isbn}</div>}
                {book.pageCount && <div><span className="text-muted-foreground">Pages:</span> {book.pageCount}</div>}
                <div><span className="text-muted-foreground">Language:</span> {book.language}</div>
              </div>

              <div className="flex gap-2 pt-2">
                {book.availableCopies > 0 ? (
                  <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                    <DialogTrigger asChild>
                      <Button><BookCheck className="h-4 w-4 mr-2" /> Check Out</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Check Out &quot;{book.title}&quot;</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Due Date</Label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="date"
                              value={dueDate || defaultDue}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="pl-10"
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>
                        <Button onClick={handleCheckout} disabled={submitting} className="w-full">
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Checkout
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button variant="secondary" onClick={handleReserve}>
                    <BookX className="h-4 w-4 mr-2" /> Reserve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isStaff && book.transactions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Active Checkouts</CardTitle></CardHeader>
              <CardContent>
                {book.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{t.user.name || "Unknown"}</span>
                    <Badge variant={isOverdue(t.dueDate) ? "destructive" : "outline"}>
                      Due {formatDate(t.dueDate)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Reviews</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => setRating(v)} className="focus:outline-none">
                      <Star className={`h-5 w-5 transition-colors ${v <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Write a review (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                <Button size="sm" onClick={handleReview} disabled={rating === 0 || reviewLoading}>
                  {reviewLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Submit Review
                </Button>
              </div>

              {book.reviews.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {book.reviews.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.user.image || ""} />
                        <AvatarFallback>{r.user.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{r.user.name}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <Star key={v} className={`h-3 w-3 ${v <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                        </div>
                        {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
