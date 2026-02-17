"use client";

import { useEffect, useState, use } from "react";
import { BookForm } from "@/components/books/book-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookFormData } from "@/lib/validators";

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<(BookFormData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => setBook({ ...data, id: data.id }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96" />;
  if (!book) return <p>Book not found</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <BookForm initialData={book} mode="edit" />
    </div>
  );
}
