"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { bookSchema, type BookFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, Search } from "lucide-react";

interface BookFormProps {
  initialData?: BookFormData & { id?: string };
  mode: "create" | "edit";
}

export function BookForm({ initialData, mode }: BookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isbnLoading, setIsbnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookFormData>({
    
    defaultValues: initialData || {
      language: "English",
      totalCopies: 1,
    },
  });

  const title = watch("title");
  const author = watch("author");
  const isbn = watch("isbn");

  const onSubmit = async (data: BookFormData) => {
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/books" : `/api/books/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.fieldErrors ? "Validation failed" : err.error || "Failed to save");
      }

      const book = await res.json();
      toast.success(mode === "create" ? "Book added!" : "Book updated!");
      router.push(`/books/${book.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const lookupISBN = async () => {
    if (!isbn) return;
    setIsbnLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (!res.ok) throw new Error("ISBN not found");
      const data = await res.json();

      if (data.title) setValue("title", data.title);
      if (data.number_of_pages) setValue("pageCount", data.number_of_pages);

      if (data.authors?.[0]?.key) {
        const authorRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`);
        const authorData = await authorRes.json();
        if (authorData.name) setValue("author", authorData.name);
      }

      if (data.publishers?.[0]) setValue("publisher", data.publishers[0]);
      if (data.publish_date) {
        const year = parseInt(data.publish_date.match(/\d{4}/)?.[0] || "");
        if (year) setValue("publishedYear", year);
      }

      const coverId = data.covers?.[0];
      if (coverId) {
        setValue("coverImage", `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
      }

      toast.success("Book info fetched from Open Library!");
    } catch {
      toast.error("Could not find book with that ISBN");
    } finally {
      setIsbnLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!title || !author) {
      toast.error("Enter title and author first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, isbn }),
      });
      const data = await res.json();
      if (data.summary) {
        setValue("description", data.summary);
        toast.success("AI summary generated!");
      }
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add New Book" : "Edit Book"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" placeholder="978-..." {...register("isbn")} />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={lookupISBN} disabled={isbnLoading}>
                {isbnLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Lookup</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="author">Author *</Label>
              <Input id="author" {...register("author")} />
              {errors.author && <p className="mt-1 text-sm text-destructive">{errors.author.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button type="button" variant="ghost" size="sm" onClick={generateSummary} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                AI Generate
              </Button>
            </div>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" placeholder="Fiction, Sci-Fi, etc." {...register("genre")} />
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input id="publisher" {...register("publisher")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="publishedYear">Published Year</Label>
              <Input id="publishedYear" type="number" {...register("publishedYear")} />
            </div>
            <div>
              <Label htmlFor="pageCount">Page Count</Label>
              <Input id="pageCount" type="number" {...register("pageCount")} />
            </div>
            <div>
              <Label htmlFor="totalCopies">Total Copies</Label>
              <Input id="totalCopies" type="number" min={1} {...register("totalCopies")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="language">Language</Label>
              <Input id="language" {...register("language")} />
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input id="coverImage" placeholder="https://..." {...register("coverImage")} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Add Book" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
