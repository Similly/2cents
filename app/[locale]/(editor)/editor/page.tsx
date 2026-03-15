import {getTranslations} from "next-intl/server";
import {createDraftAction} from "./actions";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";
import {getEditorPosts} from "@/lib/data";
import {requireAdmin} from "@/lib/auth-utils";
import {formatDate} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditorOverviewPage({params}: {params: Promise<{locale: string}>}) {
  await requireAdmin();
  const {locale} = await params;
  const t = await getTranslations("editor");
  const posts = await getEditorPosts(locale);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 pb-14 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl">{t("overview")}</h1>
        <form
          action={async () => {
            "use server";
            await createDraftAction(locale);
          }}
        >
          <Button type="submit">{t("new")}</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-site-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-site-border bg-site-panel text-site-muted">
            <tr>
              <th className="px-4 py-3">Titel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktualisiert</th>
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
