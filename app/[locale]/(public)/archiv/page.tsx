import {Filter} from "lucide-react";
import {getTranslations} from "next-intl/server";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {PostCard} from "@/components/public/post-card";
import {Link} from "@/i18n/navigation";
import {getArchiveData} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{q?: string; category?: string; tag?: string}>;
}) {
  const {locale} = await params;
  const resolvedSearch = await searchParams;
  const t = await getTranslations("archive");

  const {posts, categories, tags} = await getArchiveData(locale, resolvedSearch);

  return (
    <div>
      <header>
        <h1 className="text-7xl leading-none">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-[2rem] leading-[1.35] text-site-muted">{t("description")}</p>
      </header>

      <form className="mt-8">
        <Input defaultValue={resolvedSearch.q} name="q" placeholder={t("search")} />
      </form>

      <section className="mt-8 space-y-6">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-site-muted">
            <Filter className="h-4 w-4" />
            {t("filterByCategory")}
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                className="rounded-full bg-site-pill px-4 py-2 text-sm hover:bg-site-border"
                href={{pathname: "/archiv", query: {category: category.slug}}}
                key={category.id}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-site-muted">{t("popularTags")}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link href={{pathname: "/archiv", query: {tag: tag.slug}}} key={tag.id}>
                <Badge>#{tag.slug}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => {
          const translation = post.translations[0];
          if (!translation) return null;

          return (
            <PostCard
              key={post.id}
              category={post.category?.name}
              date={post.publishedAt}
              excerpt={translation.excerpt}
              locale={locale}
              readingTimeMin={translation.readingTimeMin}
              slug={translation.slug}
              title={translation.title}
            />
          );
        })}
      </section>

      {posts.length === 0 ? <p className="mt-8 text-site-muted">{t("empty")}</p> : null}
    </div>
  );
}
