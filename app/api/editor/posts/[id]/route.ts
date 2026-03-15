import {NextResponse} from "next/server";
import {PostStatus, Prisma} from "@prisma/client";
import {auth} from "@/auth";
import {contentJsonToHtml, extractTextFromContent} from "@/lib/editor";
import {prisma} from "@/lib/prisma";
import {postUpsertSchema} from "@/lib/validators";
import {estimateReadingMinutes, slugifyValue} from "@/lib/utils";

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => slugifyValue(tag).replace(/^#/, "")).filter(Boolean))];
}

export async function PATCH(req: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const {id} = await params;
  const body = await req.json();

  const parsed = postUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({error: parsed.error.flatten()}, {status: 400});
  }

  const input = parsed.data;
  const contentJson = input.contentJson as Prisma.InputJsonValue;
  const readingTimeMin = estimateReadingMinutes(extractTextFromContent(input.contentJson));
  const contentHtml = contentJsonToHtml(input.contentJson);
  const tagSlugs = normalizeTags(input.tags);

  const tags = await Promise.all(
    tagSlugs.map((slug) =>
      prisma.tag.upsert({
        where: {slug},
        update: {},
        create: {slug, name: slug},
      })
    )
  );

  const post = await prisma.post.update({
    where: {id},
    data: {
      status: input.status === "PUBLISHED" ? PostStatus.PUBLISHED : PostStatus.DRAFT,
      featured: input.featured,
      categoryId: input.categoryId || null,
      coverImage: input.coverImage || null,
      coverAlt: input.coverAlt || null,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      tags: {
        deleteMany: {},
        create: tags.map((tag) => ({tagId: tag.id})),
      },
      translations: {
        upsert: {
          where: {
            postId_locale: {
              postId: id,
              locale: input.locale,
            },
          },
          create: {
            locale: input.locale,
            title: input.title,
            slug: slugifyValue(input.slug),
            excerpt: input.excerpt,
            contentJson,
            contentHtml,
            seoTitle: input.seoTitle || null,
            seoDescription: input.seoDescription || null,
            readingTimeMin,
          },
          update: {
            title: input.title,
            slug: slugifyValue(input.slug),
            excerpt: input.excerpt,
            contentJson,
            contentHtml,
            seoTitle: input.seoTitle || null,
            seoDescription: input.seoDescription || null,
            readingTimeMin,
          },
        },
      },
    },
    include: {
      translations: {
        where: {locale: input.locale},
      },
    },
  });

  return NextResponse.json({post});
}
