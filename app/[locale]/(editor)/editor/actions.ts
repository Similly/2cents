"use server";

import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {getDefaultContentJson} from "@/lib/editor";

export async function createDraftAction(locale: string) {
  const post = await prisma.post.create({
    data: {
      translations: {
        create: {
          locale,
          title: "Neuer Essay",
          slug: `neuer-essay-${Date.now()}`,
          excerpt: "Kurze Beschreibung...",
          contentJson: getDefaultContentJson(),
          contentHtml: "",
          readingTimeMin: 1,
        },
      },
    },
  });

  redirect(`/${locale}/editor/posts/${post.id}`);
}
