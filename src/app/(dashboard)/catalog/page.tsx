"use client";

import { useEffect, useState, useCallback } from "react";
import { BookCard } from "@/components/books/book-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Sparkles, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
  genre?: string | null;
  availableCopies: number;
  totalCopies: number;
  reviews?: { rating: number }[];
}

const GENRES = [
  "Fiction", "Non-Fiction", "Sci-Fi", "Fantasy", "Mystery",
  "Romance", "Thriller", "Biography", "History", "Science",
  "Philosophy", "Classic", "Horror", "Self-Help",
];

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "12",
    });
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    if (availableOnly) params.set("available", "true");

    const res = await fetch(`/api/books?${params}`);
    const data = await res.json();
    setBooks(data.books);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, query, genre, availableOnly]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiSearching(true);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();
      setBooks(data.books);
      setTotalPages(1);
    } finally {
      setAiSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Book Catalog</h1>
        <p className="text-muted-foreground">Browse and discover books in the library</p>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, ISBN, or genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="AI Search: e.g. &quot;Find me a mystery novel from the 90s&quot;"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
            />
          </div>
          <Button variant="secondary" onClick={handleAISearch} disabled={aiSearching}>
            {aiSearching ? "Searching..." : "AI Search"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={genre} onValueChange={(v) => { setGenre(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="available"
              checked={availableOnly}
              onCheckedChange={(v) => { setAvailableOnly(v === true); setPage(1); }}
            />
            <label htmlFor="available" className="text-sm">Available only</label>
          </div>

          <div className="ml-auto flex gap-1">
            <Button size="icon" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button size="icon" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "space-y-3"}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className={view === "grid" ? "aspect-[2/3]" : "h-24"} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookCard book={{ id: "", title: "No books found", author: "Try adjusting your search", availableCopies: 0, totalCopies: 0 }} />
          <p className="mt-4 text-muted-foreground">No books match your search criteria</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {books.map((book) => (
            <a key={book.id} href={`/books/${book.id}`} className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent">
              <div className="h-16 w-12 overflow-hidden rounded bg-muted flex-shrink-0">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">{book.title[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{book.title}</p>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </div>
              {book.genre && <Badge variant="outline">{book.genre}</Badge>}
              <Badge variant={book.availableCopies > 0 ? "default" : "destructive"}>
                {book.availableCopies > 0 ? `${book.availableCopies} avail.` : "Out"}
              </Badge>
            </a>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
