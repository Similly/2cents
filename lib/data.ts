import {PostStatus, Prisma} from "@prisma/client";
import {cache} from "react";
import {prisma} from "@/lib/prisma";

const translationInclude = (locale: string) => ({
  translations: {
    where: {locale},
    take: 1,
  },
  category: true,
  tags: {
    include: {
      tag: true,
    },
  },
});

export type PostListItem = Prisma.PostGetPayload<{
  include: {
    translations: true;
    category: true;
    tags: {include: {tag: true}};
  };
}>;

export const getHomeData = cache(async (locale: string) => {
  const posts = await prisma.post.findMany({
    where: {status: PostStatus.PUBLISHED},
    include: translationInclude(locale),
    orderBy: [{featured: "desc"}, {publishedAt: "desc"}],
    take: 7,
  });

  const featured = posts[0] ?? null;
  const recent = posts.slice(1);

  return {featured, recent};
});

export const getArchiveData = cache(async (locale: string, filters?: {q?: string; category?: string; tag?: string}) => {
  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      category: filters?.category ? {slug: filters.category} : undefined,
      tags: filters?.tag
        ? {
            some: {
              tag: {slug: filters.tag},
            },
          }
        : undefined,
      translations: {
        some: {
          locale,
          OR: filters?.q
            ? [
                {title: {contains: filters.q, mode: "insensitive"}},
                {excerpt: {contains: filters.q, mode: "insensitive"}},
                {contentHtml: {contains: filters.q, mode: "insensitive"}},
              ]
            : undefined,
        },
      },
    },
    include: translationInclude(locale),
    orderBy: {publishedAt: "desc"},
  });

  const categories = await prisma.category.findMany({orderBy: {name: "asc"}});
  const tags = await prisma.tag.findMany({orderBy: {name: "asc"}, take: 12});

  return {posts, categories, tags};
});

export const getPostBySlug = cache(async (locale: string, slug: string) => {
  const translation = await prisma.postTranslation.findUnique({
    where: {
      locale_slug: {locale, slug},
    },
    include: {
      post: {
        include: {
          category: true,
          tags: {include: {tag: true}},
          translations: true,
        },
      },
    },
  });

  return translation;
});

export const getRelatedPosts = cache(async (locale: string, postId: string, categoryId?: string | null) => {
  return prisma.post.findMany({
    where: {
      id: {not: postId},
      status: PostStatus.PUBLISHED,
      categoryId: categoryId ?? undefined,
    },
    include: translationInclude(locale),
    orderBy: {publishedAt: "desc"},
    take: 3,
  });
});

export async function getSiteSettings(locale: string) {
  const settings = await prisma.siteSettings.findUnique({where: {locale}});
  if (settings) return settings;

  return prisma.siteSettings.findFirst({where: {locale: "de"}});
}

export const getEditorPosts = cache(async (locale: string) => {
  return prisma.post.findMany({
    include: translationInclude(locale),
    orderBy: {updatedAt: "desc"},
  });
});

export const getPostForEditor = cache(async (id: string, locale: string) => {
  return prisma.post.findUnique({
    where: {id},
    include: {
      category: true,
      tags: {include: {tag: true}},
      translations: {
        where: {locale},
        take: 1,
      },
    },
  });
});

export async function getEditorMeta() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({orderBy: {name: "asc"}}),
    prisma.tag.findMany({orderBy: {name: "asc"}}),
  ]);

  return {categories, tags};
}
