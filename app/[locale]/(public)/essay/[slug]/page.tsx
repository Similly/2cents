import {Clock3, LinkIcon, UserRound} from "lucide-react";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {PostCard} from "@/components/public/post-card";
import {ReadingProgress} from "@/components/public/reading-progress";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {getPostBySlug, getRelatedPosts} from "@/lib/data";
import {absoluteUrl, formatDate} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const translation = await getPostBySlug(locale, slug);

  if (!translation) {
    return {};
  }

  return {
    title: translation.seoTitle || translation.title,
    description: translation.seoDescription || translation.excerpt,
    alternates: {
      canonical: absoluteUrl(`/essay/${translation.slug}`),
    },
    openGraph: {
      title: translation.seoTitle || translation.title,
      description: translation.seoDescription || translation.excerpt,
      type: "article",
      publishedTime: translation.post.publishedAt?.toISOString(),
      images: translation.post.coverImage ? [absoluteUrl(translation.post.coverImage)] : undefined,
    },
  };
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  const t = await getTranslations("post");

  const translation = await getPostBySlug(locale, slug);
  if (!translation) notFound();

  const related = await getRelatedPosts(locale, translation.post.id, translation.post.categoryId);

  return (
    <article className="mx-auto max-w-[800px] pb-24">
      <ReadingProgress />
      <header className="mb-10 border-b border-site-border pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {translation.post.category ? <Badge>{translation.post.category.name}</Badge> : null}
          {translation.post.tags.map((tag) => (
            <Badge key={tag.tagId}>#{tag.tag.slug}</Badge>
          ))}
        </div>

        <h1 className="text-[4.1rem] leading-[0.95] text-site-ink md:text-[5rem]">{translation.title}</h1>
        <p className="mt-5 text-[2rem] leading-[1.35] text-site-muted">{translation.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-site-muted">
          <span className="inline-flex items-center gap-2">
            <UserRound className="h-4 w-4" /> 2cents
          </span>
          <span>{translation.post.publishedAt ? formatDate(translation.post.publishedAt, locale) : "-"}</span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" /> {translation.readingTimeMin} {t("minRead")}
          </span>
          <Button className="h-8" size="sm" type="button" variant="outline">
            <LinkIcon className="mr-1 h-4 w-4" />
            {t("copyLink")}
          </Button>
        </div>
      </header>

      <section className="prose-essay" dangerouslySetInnerHTML={{__html: translation.contentHtml}} />

      <section className="mt-16">
        <h2 className="mb-5 text-5xl">{t("related")}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {related.map((post) => {
            const relTrans = post.translations[0];
            if (!relTrans) return null;
            return (
              <PostCard
                key={post.id}
                category={post.category?.name}
                date={post.publishedAt}
                excerpt={relTrans.excerpt}
                locale={locale}
                readingTimeMin={relTrans.readingTimeMin}
                slug={relTrans.slug}
                title={relTrans.title}
              />
            );
          })}
        </div>
      </section>
    </article>
  );
}
