import { z } from "zod";

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  publishedYear: z.coerce.number().int().min(0).max(2100).optional().nullable(),
  pageCount: z.coerce.number().int().min(0).optional().nullable(),
  language: z.string().optional().default("English"),
  totalCopies: z.coerce.number().int().min(1).optional().default(1),
});

export const checkoutSchema = z.object({
  bookId: z.string().min(1),
  userId: z.string().min(1),
  dueDate: z.string().min(1, "Due date is required"),
});

export const reviewSchema = z.object({
  bookId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

export type BookFormData = z.infer<typeof bookSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
