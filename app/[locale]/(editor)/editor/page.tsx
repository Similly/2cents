import {getTranslations} from "next-intl/server";
import {createCategoryAction, createDraftAction, deleteCategoryAction, deletePostAction} from "./actions";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/i18n/navigation";
import {getEditorPosts} from "@/lib/data";
import {requireAdmin} from "@/lib/auth-utils";
import {formatDate} from "@/lib/utils";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditorOverviewPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireAdmin(locale);
  const t = await getTranslations("editor");
  const [posts, categories] = await Promise.all([
    getEditorPosts(locale),
    prisma.category.findMany({
      orderBy: {name: "asc"},
      include: {
        _count: {
          select: {posts: true},
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 pb-14 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl">{t("overview")}</h1>
        <div className="flex items-center gap-2">
          <Link href="/editor/settings">
            <Button type="button" variant="outline">
              {t("settings")}
            </Button>
          </Link>
          <form
            action={async () => {
              "use server";
              await createDraftAction(locale);
            }}
          >
            <Button type="submit">{t("new")}</Button>
          </form>
        </div>
      </div>

      <section className="mb-6 rounded-xl border border-site-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl">Kategorien</h2>
        </div>

        <form action={createCategoryAction.bind(null, locale)} className="mb-4 flex gap-2">
          <Input name="name" placeholder="Neue Kategorie (z.B. Philosophie)" required />
          <Button type="submit">Hinzufügen</Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="inline-flex items-center gap-2 rounded-full border border-site-border bg-site-panel px-3 py-1.5 text-sm"
            >
              <span>
                {category.name} <span className="text-site-muted">({category._count.posts})</span>
              </span>
              <form action={deleteCategoryAction.bind(null, locale, category.id)}>
                <button className="text-site-muted hover:text-red-600" type="submit">
                  Löschen
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-site-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-site-border bg-site-panel text-site-muted">
            <tr>
              <th className="px-4 py-3">Titel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktualisiert</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const translation = post.translations[0];
              return (
                <tr className="border-b border-site-border/70" key={post.id}>
                  <td className="px-4 py-3">
                    <Link className="font-medium hover:text-site-accent" href={`/editor/posts/${post.id}`}>
                      {translation?.title ?? "Untitled"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{post.status === "PUBLISHED" ? t("published") : t("draft")}</td>
                  <td className="px-4 py-3 text-site-muted">{formatDate(post.updatedAt, locale)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePostAction.bind(null, locale, post.id)}>
                      <Button type="submit" variant="outline">
                        Löschen
                      </Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {posts.length === 0 ? <p className="mt-4 text-site-muted">{t("noPosts")}</p> : null}
    </div>
  );
}
