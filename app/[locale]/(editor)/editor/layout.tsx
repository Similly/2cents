import {ChevronLeft, House} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";

export default async function EditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return (
    <div className="min-h-screen bg-site">
      <div className="sticky top-0 z-30 border-b border-site-border bg-site-panel/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-3">
          <Link href="/editor">
            <Button type="button" variant="ghost">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {locale === "de" ? "Admin" : "Admin"}
            </Button>
          </Link>

          <Link href="/">
            <Button type="button" variant="outline">
              <House className="mr-2 h-4 w-4" />
              {locale === "de" ? "Zum Blog" : "Back to blog"}
            </Button>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
