"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {slugifyValue} from "@/lib/utils";

function localeEditorPath(locale: string) {
  return locale === "de" ? "/editor" : `/${locale}/editor`;
}

export async function createDraftAction(locale: string) {
  const post = await prisma.post.create({
    data: {
      translations: {
        create: {
          locale,
          title: "Neuer Essay",
          slug: `neuer-essay-${Date.now()}`,
          excerpt: "Kurze Beschreibung...",
          contentJson: {type: "markdown", markdown: ""},
          contentHtml: "",
          readingTimeMin: 1,
        },
      },
    },
  });

  redirect(`${localeEditorPath(locale)}/posts/${post.id}`);
}

export async function createCategoryAction(locale: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const slug = slugifyValue(name);
  if (!slug) return;

  await prisma.category.upsert({
    where: {slug},
    update: {name},
    create: {name, slug},
  });

  revalidatePath(localeEditorPath(locale));
}

export async function deleteCategoryAction(locale: string, categoryId: string) {
  await prisma.category.delete({
    where: {id: categoryId},
  });

  revalidatePath(localeEditorPath(locale));
}

export async function deletePostAction(locale: string, postId: string) {
  await prisma.post.delete({
    where: {id: postId},
  });

  revalidatePath(localeEditorPath(locale));
}
