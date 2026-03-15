import {getTranslations} from "next-intl/server";
import {PostCard} from "@/components/public/post-card";
import {SiteFooter} from "@/components/public/site-footer";
import {Link} from "@/i18n/navigation";
import {getHomeData} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations("home");
  const {featured, recent} = await getHomeData(locale);

  const featuredTranslation = featured?.translations[0];

  return (
    <div>
      <p className="max-w-[42rem] text-[2rem] leading-[1.45] text-[#6a615d]">{t("intro")}</p>

      {featured && featuredTranslation ? (
        <section className="mt-14">
          <PostCard
            category={featured.category?.name}
            date={featured.publishedAt}
            excerpt={featuredTranslation.excerpt}
            featured
            locale={locale}
            readingTimeMin={featuredTranslation.readingTimeMin}
            slug={featuredTranslation.slug}
            title={featuredTranslation.title}
          />
        </section>
      ) : null}

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-5xl">{t("recent")}</h2>
          <Link className="text-sm font-semibold text-site-accent" href="/archiv">
            {t("viewAll")} →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {recent.map((post) => {
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
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
