import type {MetadataRoute} from "next";
import {prisma} from "@/lib/prisma";
import {absoluteUrl} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.postTranslation.findMany({
    where: {
      locale: "de",
      post: {
        status: "PUBLISHED",
      },
    },
    include: {
      post: true,
    },
    orderBy: {
      post: {publishedAt: "desc"},
    },
  });

  const staticPages: MetadataRoute.Sitemap = ["", "/archiv", "/about"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/essay/${post.slug}`),
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...postPages];
}
