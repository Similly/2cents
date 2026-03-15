import {CheckCircle2, Settings2} from "lucide-react";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {ProfileImageField} from "@/components/editor/profile-image-field";
import {Link} from "@/i18n/navigation";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/auth-utils";
import {siteSettingsUpdateSchema} from "@/lib/validators";

export const dynamic = "force-dynamic";

function splitTopics(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
}

export default async function EditorSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: "de" | "en"}>;
  searchParams: Promise<{saved?: string}>;
}) {
  const {locale} = await params;
  const resolvedSearch = await searchParams;
  await requireAdmin(locale);

  const existing = await prisma.siteSettings.findUnique({where: {locale}});
  const fallbackDe =
    locale === "de" ? null : await prisma.siteSettings.findUnique({where: {locale: "de"}});

  const settings = existing || fallbackDe;

  if (!settings) {
    throw new Error("Site settings not found. Seed data first.");
  }

  const topics = Array.isArray(settings.aboutTopics)
    ? (settings.aboutTopics as unknown[])
        .map((item) => (typeof item === "string" ? item : ""))
        .filter(Boolean)
    : [];

  const socialLinksRaw = settings.socialLinks as Record<string, unknown> | null;
  const socialTwitter = typeof socialLinksRaw?.twitter === "string" ? socialLinksRaw.twitter : "";
  const socialEmail = typeof socialLinksRaw?.email === "string" ? socialLinksRaw.email : "";
  const socialWebsite = typeof socialLinksRaw?.website === "string" ? socialLinksRaw.website : "";
  const profileImage = typeof socialLinksRaw?.profileImage === "string" ? socialLinksRaw.profileImage : "";
  const homeIntro = typeof socialLinksRaw?.homeIntro === "string" ? socialLinksRaw.homeIntro : "";

  async function saveAction(formData: FormData) {
    "use server";

    const parsed = siteSettingsUpdateSchema.safeParse({
      locale,
      siteName: String(formData.get("siteName") || ""),
      tagline: String(formData.get("tagline") || ""),
      homeIntro: String(formData.get("homeIntro") || ""),
      aboutTitle: String(formData.get("aboutTitle") || ""),
      aboutIntro: String(formData.get("aboutIntro") || ""),
      aboutBody: String(formData.get("aboutBody") || ""),
      aboutTopicsText: String(formData.get("aboutTopicsText") || ""),
      aboutWhyTitle: String(formData.get("aboutWhyTitle") || ""),
      aboutWhyBody: String(formData.get("aboutWhyBody") || ""),
      profileImage: String(formData.get("profileImage") || ""),
      socialTwitter: String(formData.get("socialTwitter") || ""),
      socialEmail: String(formData.get("socialEmail") || ""),
      socialWebsite: String(formData.get("socialWebsite") || ""),
    });

    if (!parsed.success) {
      throw new Error("Ungültige Eingaben in den Settings.");
    }

    const input = parsed.data;

    await prisma.siteSettings.upsert({
      where: {locale: input.locale},
      create: {
        locale: input.locale,
        siteName: input.siteName,
        tagline: input.tagline,
        aboutTitle: input.aboutTitle,
        aboutIntro: input.aboutIntro,
        aboutBody: input.aboutBody,
        aboutTopics: splitTopics(input.aboutTopicsText),
        aboutWhyTitle: input.aboutWhyTitle,
        aboutWhyBody: input.aboutWhyBody,
        socialLinks: {
          profileImage: input.profileImage,
          homeIntro: input.homeIntro,
          twitter: input.socialTwitter,
          email: normalizeEmail(input.socialEmail),
          website: input.socialWebsite,
        },
      },
      update: {
        siteName: input.siteName,
        tagline: input.tagline,
        aboutTitle: input.aboutTitle,
        aboutIntro: input.aboutIntro,
        aboutBody: input.aboutBody,
        aboutTopics: splitTopics(input.aboutTopicsText),
        aboutWhyTitle: input.aboutWhyTitle,
        aboutWhyBody: input.aboutWhyBody,
        socialLinks: {
          profileImage: input.profileImage,
          homeIntro: input.homeIntro,
          twitter: input.socialTwitter,
          email: normalizeEmail(input.socialEmail),
          website: input.socialWebsite,
        },
      },
    });

    const prefix = locale === "de" ? "" : `/${locale}`;
    revalidatePath(`${prefix}/`);
    revalidatePath(`${prefix}/about`);
    revalidatePath(`${prefix}/archiv`);
    revalidatePath(`${prefix}/editor/settings`);

    redirect(`${locale === "de" ? "" : `/${locale}`}/editor/settings?saved=1`);
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pb-14 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-5xl">About & Site Settings</h1>
          <p className="mt-2 text-site-muted">Verwalte Inhalte deiner About-Seite direkt im Admin Panel.</p>
        </div>
        <Link href="/editor">
          <Button type="button" variant="outline">
            Zurück zu Beiträgen
          </Button>
        </Link>
      </div>

      {resolvedSearch.saved === "1" ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Einstellungen gespeichert
        </div>
      ) : null}

      <form action={saveAction} className="space-y-6 rounded-xl border border-site-border bg-white p-6">
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-3xl">
            <Settings2 className="h-5 w-5" /> Global
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-site-muted">Site Name</label>
              <Input defaultValue={settings.siteName} name="siteName" required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-site-muted">Tagline</label>
              <Input defaultValue={settings.tagline} name="tagline" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-site-muted">Home Intro Text</label>
            <Textarea
              className="min-h-[120px]"
              defaultValue={homeIntro}
              name="homeIntro"
              placeholder="Kurzer Intro-Text auf der Startseite ..."
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-site-border pt-6">
          <h2 className="text-3xl">About-Seite</h2>

          <ProfileImageField defaultValue={profileImage} />

          <div>
            <label className="mb-1 block text-sm text-site-muted">About Title</label>
            <Input defaultValue={settings.aboutTitle} name="aboutTitle" required />
          </div>

          <div>
            <label className="mb-1 block text-sm text-site-muted">About Intro</label>
            <Textarea defaultValue={settings.aboutIntro} name="aboutIntro" required />
          </div>

          <div>
            <label className="mb-1 block text-sm text-site-muted">About Body (Absätze mit Leerzeile trennen)</label>
            <Textarea className="min-h-[220px]" defaultValue={settings.aboutBody} name="aboutBody" required />
          </div>

          <div>
            <label className="mb-1 block text-sm text-site-muted">Topics (eine Zeile pro Stichpunkt)</label>
            <Textarea className="min-h-[180px]" defaultValue={topics.join("\n")} name="aboutTopicsText" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-site-muted">Why Title</label>
              <Input defaultValue={settings.aboutWhyTitle} name="aboutWhyTitle" required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-site-muted">Why Body</label>
              <Textarea defaultValue={settings.aboutWhyBody} name="aboutWhyBody" required />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-site-border pt-6">
          <h2 className="text-3xl">Social Links</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-site-muted">Twitter URL</label>
              <Input defaultValue={socialTwitter} name="socialTwitter" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-site-muted">Email</label>
              <Input defaultValue={socialEmail.replace("mailto:", "")} name="socialEmail" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-site-muted">Website URL</label>
              <Input defaultValue={socialWebsite} name="socialWebsite" />
            </div>
          </div>
        </section>

        <div className="flex justify-end border-t border-site-border pt-4">
          <Button type="submit">Speichern</Button>
        </div>
      </form>
    </div>
  );
}
