import {z} from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const postUpsertSchema = z.object({
  locale: z.enum(["de", "en"]).default("de"),
  title: z.string().min(1).max(180),
  slug: z.string().min(1).max(220),
  excerpt: z.string().max(400).default(""),
  contentMarkdown: z.string().default(""),
  contentJson: z.unknown().optional(),
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

export const siteSettingsUpdateSchema = z.object({
  locale: z.enum(["de", "en"]).default("de"),
  siteName: z.string().min(1).max(120),
  tagline: z.string().max(180).default(""),
  homeIntro: z.string().max(1500).default(""),
  aboutTitle: z.string().min(1).max(180),
  aboutIntro: z.string().min(1).max(1200),
  aboutBody: z.string().min(1).max(8000),
  aboutTopicsText: z.string().default(""),
  aboutWhyTitle: z.string().min(1).max(180),
  aboutWhyBody: z.string().min(1).max(2500),
  profileImage: z.string().max(500).default(""),
  socialTwitter: z.string().max(300).default(""),
  socialEmail: z.string().max(300).default(""),
  socialWebsite: z.string().max(300).default(""),
});
