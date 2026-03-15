import {z} from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const postUpsertSchema = z.object({
  locale: z.enum(["de", "en"]).default("de"),
  title: z.string().min(3).max(180),
  slug: z.string().min(3).max(220),
  excerpt: z.string().min(10).max(400),
  contentJson: z.unknown(),
  featured: z.boolean().default(false),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().nullable().optional(),
  coverAlt: z.string().nullable().optional(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(240).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const postFilterSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
});
