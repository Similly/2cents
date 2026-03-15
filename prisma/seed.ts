import bcrypt from "bcryptjs";
import {PrismaClient} from "@prisma/client";
import type {JSONContent} from "@tiptap/core";
import {contentJsonToHtml, extractTextFromContent} from "../lib/editor";
import {estimateReadingMinutes, slugifyValue} from "../lib/utils";

const prisma = new PrismaClient();

type SeedPost = {
  category: string;
  title: string;
  excerpt: string;
  featured?: boolean;
  publishedAt: string;
  tags: string[];
  content: JSONContent;
};

const posts: SeedPost[] = [
  {
    category: "Kultur",
    title: "Die Architektur der Stille",
    excerpt:
      "In einer Welt voller Lärm wird die bewusste Entscheidung für Stille zu einem radikalen Akt der Selbstbestimmung.",
    featured: true,
    publishedAt: "2026-03-12T09:00:00.000Z",
    tags: ["kultur", "achtsamkeit", "modernes-leben"],
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: {level: 2},
          content: [{type: "text", text: "Warum Stille politisch ist"}],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Stille ist kein Mangel an Inhalt. Sie ist ein Raum, in dem Wahrnehmung wieder scharf wird. Wenn alles um Aufmerksamkeit konkurriert, wirkt ein leiser Moment fast subversiv.",
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{type: "text", text: "Wer nie innehält, hört am Ende nur noch Echo."}],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Vielleicht ist die wichtigste Praxis unserer Zeit nicht Produktivität, sondern Pausenkompetenz.",
            },
          ],
        },
      ],
    },
  },
  {
    category: "Technologie",
    title: "Warum wir digitale Gärten bauen",
    excerpt:
      "Das Internet sollte einmal ein Garten sein. Irgendwo auf dem Weg wurde es zur Fabrik.",
    publishedAt: "2026-03-08T09:00:00.000Z",
    tags: ["technologie", "internet-kultur", "kreativitaet"],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Digitale Gärten sind langsam. Sie wachsen nicht entlang von Launch-Deadlines, sondern entlang echter Gedankenbewegung.",
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {type: "listItem", content: [{type: "paragraph", content: [{type: "text", text: "weniger Performance"}]}]},
            {type: "listItem", content: [{type: "paragraph", content: [{type: "text", text: "mehr Prozess"}]}]},
            {type: "listItem", content: [{type: "paragraph", content: [{type: "text", text: "mehr Verbindung statt Reichweite"}]}]},
          ],
        },
      ],
    },
  },
  {
    category: "Reisen",
    title: "Vom Vergnügen, sich zu verlaufen",
    excerpt: "Navigations-Apps haben das Verlorengehen fast unmöglich gemacht. Doch wir verlieren damit auch etwas anderes.",
    publishedAt: "2026-02-28T09:00:00.000Z",
    tags: ["reisen", "aufmerksamkeit"],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Verlorengehen ist eine Methode. Es zwingt uns, von Karten auf Sinne umzuschalten.",
            },
          ],
        },
      ],
    },
  },
  {
    category: "Kultur",
    title: "Die Tyrannei der Produktivität",
    excerpt: "Jede Minute optimiert, jede Stunde verbucht. Was bleibt vom Leben zwischen den Checklisten?",
    publishedAt: "2026-02-20T09:00:00.000Z",
    tags: ["produktivitaet", "kultur"],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Produktivität ist ein Werkzeug. Wenn sie zur Identität wird, verlernen wir zweckfreie Freude.",
            },
          ],
        },
      ],
    },
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@2cents.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeNow123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: {email: adminEmail},
    update: {passwordHash},
    create: {
      email: adminEmail,
      passwordHash,
      name: "2cents Admin",
      role: "ADMIN",
    },
  });

  const categoryIds = new Map<string, string>();
  for (const category of ["Kultur", "Technologie", "Reisen", "Kunst", "Buecher"]) {
    const record = await prisma.category.upsert({
      where: {slug: slugifyValue(category)},
      update: {name: category},
      create: {name: category, slug: slugifyValue(category)},
    });
    categoryIds.set(category, record.id);
  }

  await prisma.siteSettings.upsert({
    where: {locale: "de"},
    update: {},
    create: {
      locale: "de",
      siteName: "2cents",
      tagline: "Essays & reflections",
      aboutTitle: "About",
      aboutIntro:
        "Hallo, ich bin die Stimme hinter 2cents. Hier untersuche ich Muster, Widersprueche und leise Aha-Momente des modernen Lebens.",
      aboutBody:
        "Ich schreibe ueber Aufmerksamkeit, Kreativitaet, digitale Kultur und das langsame Denken in einer schnellen Welt.\n\nDieser Blog ist mein digitaler Garten: Ideen wachsen hier, werden zurechtgeschnitten und bluehen manchmal spaeter als erwartet.",
      aboutTopics: [
        "Kultur und Gesellschaft im digitalen Zeitalter",
        "Kreativitaet, Kunst und der Schreibprozess",
        "Achtsamkeit, Aufmerksamkeit und Zeit",
        "Reisen, Umwege und das produktive Verlorensein",
        "Buecher, Lesen und das Leben der Ideen",
        "Technologie und ihr Einfluss auf unser Denken",
      ],
      aboutWhyTitle: "Warum '2cents'?",
      aboutWhyBody:
        "Der Name kommt von 'my two cents' - ein bescheidener Beitrag zur Debatte. Diese Texte sind keine Wahrheiten in Stein, sondern Einladungen zum Weiterdenken.",
      socialLinks: {
        twitter: "https://twitter.com/",
        email: "mailto:hello@example.com",
      },
    },
  });

  for (const post of posts) {
    const created = await prisma.post.create({
      data: {
        status: "PUBLISHED",
        featured: Boolean(post.featured),
        categoryId: categoryIds.get(post.category) || null,
        publishedAt: new Date(post.publishedAt),
      },
    });

    const text = extractTextFromContent(post.content);
    const readingTimeMin = estimateReadingMinutes(text);

    await prisma.postTranslation.create({
      data: {
        postId: created.id,
        locale: "de",
        title: post.title,
        slug: slugifyValue(post.title),
        excerpt: post.excerpt,
        contentJson: post.content,
        contentHtml: contentJsonToHtml(post.content),
        seoTitle: post.title,
        seoDescription: post.excerpt,
        readingTimeMin,
      },
    });

    for (const tagName of post.tags) {
      const slug = slugifyValue(tagName);
      const tag = await prisma.tag.upsert({
        where: {slug},
        update: {},
        create: {
          slug,
          name: tagName,
        },
      });

      await prisma.postTag.create({
        data: {
          postId: created.id,
          tagId: tag.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
