import {notFound} from "next/navigation";
import {getSiteSettings} from "@/lib/data";
import {Separator} from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AboutPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const settings = await getSiteSettings(locale);

  if (!settings) notFound();

  const topics = settings.aboutTopics as string[];

  return (
    <article className="mx-auto max-w-[720px] pb-16">
      <h1 className="text-7xl leading-none">{settings.aboutTitle}</h1>

      <div className="mt-10 inline-flex rounded-3xl border border-site-border bg-gradient-to-br from-[#c7d6d5] via-[#f1efee] to-[#e9d2cc] p-4">
        <div className="grid h-40 w-40 place-items-center rounded-2xl bg-site">
          <span className="font-serif text-7xl text-site-ink">2c</span>
        </div>
      </div>

      <div className="mt-10 space-y-6 text-[2.05rem] leading-[1.45] text-site-muted">
        <p className="text-site-ink">{settings.aboutIntro}</p>
        {settings.aboutBody.split("\n\n").map((part) => (
          <p key={part}>{part}</p>
        ))}
      </div>

      <Separator className="my-10" />

      <h2 className="text-5xl">Was ich schreibe</h2>
      <ul className="mt-4 space-y-2 text-[1.9rem] leading-[1.5] text-site-muted">
        {topics.map((topic) => (
          <li key={topic}>• {topic}</li>
        ))}
      </ul>

      <Separator className="my-10" />

      <h2 className="text-5xl">{settings.aboutWhyTitle}</h2>
      <p className="mt-4 text-[1.9rem] leading-[1.6] text-site-muted">{settings.aboutWhyBody}</p>
    </article>
  );
}
