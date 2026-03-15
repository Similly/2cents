import {notFound} from "next/navigation";
import {PostEditor} from "@/components/editor/post-editor";
import {getEditorMeta, getPostForEditor} from "@/lib/data";
import {requireAdmin} from "@/lib/auth-utils";
import {storedContentToMarkdown} from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{locale: "de" | "en"; id: string}>;
}) {
  const {id, locale} = await params;
  await requireAdmin(locale);

  const [post, meta] = await Promise.all([getPostForEditor(id, locale), getEditorMeta()]);

  if (!post) notFound();

  const translation = post.translations[0];

  return (
    <div className="mx-auto w-full max-w-[1320px] px-6 pb-14 pt-6">
      <PostEditor
        categories={meta.categories}
        id={post.id}
        initial={{
          title: translation?.title || "",
          slug: translation?.slug || "",
          excerpt: translation?.excerpt || "",
          contentMarkdown: storedContentToMarkdown(
            translation?.contentJson,
            translation?.contentHtml
          ),
          categoryId: post.categoryId,
          tags: post.tags.map((postTag) => postTag.tag.slug),
          coverImage: post.coverImage,
          coverAlt: post.coverAlt,
          featured: post.featured,
          status: post.status,
        }}
        locale={locale}
      />
    </div>
  );
}
