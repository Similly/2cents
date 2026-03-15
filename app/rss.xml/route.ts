import {prisma} from "@/lib/prisma";
import {absoluteUrl} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.postTranslation.findMany({
    where: {
      locale: "de",
      post: {status: "PUBLISHED"},
    },
    include: {
      post: true,
    },
    orderBy: {
      post: {publishedAt: "desc"},
    },
    take: 20,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>2cents</title>
<link>${absoluteUrl()}</link>
<description>Persönliche Essays auf 2cents</description>
${items
  .map(
    (item) => `<item>
<title><![CDATA[${item.title}]]></title>
<link>${absoluteUrl(`/essay/${item.slug}`)}</link>
<guid>${absoluteUrl(`/essay/${item.slug}`)}</guid>
<pubDate>${(item.post.publishedAt || item.updatedAt).toUTCString()}</pubDate>
<description><![CDATA[${item.excerpt}]]></description>
</item>`
  )
  .join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
