import {Sidebar} from "@/components/public/sidebar";
import {getSiteSettings} from "@/lib/data";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const settings = await getSiteSettings(locale);

  return (
    <div className="min-h-screen bg-site lg:flex">
      <Sidebar siteName={settings?.siteName} tagline={settings?.tagline} />
      <main className="mx-auto w-full max-w-[1024px] px-6 pb-10 pt-8 lg:px-8 lg:pt-16">{children}</main>
    </div>
  );
}
