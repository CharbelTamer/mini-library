"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverImage?: string | null;
    genre?: string | null;
    availableCopies: number;
    totalCopies: number;
    reviews?: { rating: number }[];
  };
}

export function BookCard({ book }: BookCardProps) {
  const avgRating =
    book.reviews && book.reviews.length > 0
      ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length).toFixed(1)
      : null;

  const isAvailable = book.availableCopies > 0;

  return (
    <Link href={`/books/${book.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl font-bold text-primary/30">
                {book.title[0]}
              </span>
            </div>
          )}
          <Badge
            variant={isAvailable ? "default" : "destructive"}
            className="absolute right-2 top-2"
          >
            {isAvailable ? `${book.availableCopies} available` : "Checked out"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-1 font-semibold">{book.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
          <div className="mt-2 flex items-center justify-between">
            {book.genre && (
              <Badge variant="outline" className="text-xs">
                {book.genre}
              </Badge>
            )}
            {avgRating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{avgRating}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
