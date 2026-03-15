"use client";

import {Archive, Home, Menu, PencilLine, Search, UserRound} from "lucide-react";
import {LucideIcon} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {Link, usePathname} from "@/i18n/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

const items: Array<{href: "/" | "/archiv" | "/about" | "/editor"; key: "home" | "archive" | "about" | "write"; icon?: LucideIcon}> = [
  {href: "/", key: "home", icon: Home},
  {href: "/archiv", key: "archive", icon: Archive},
  {href: "/about", key: "about", icon: UserRound},
  {href: "/editor", key: "write", icon: PencilLine},
];

function NavLinks({onNavigate}: {onNavigate?: () => void}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="space-y-1 text-[15px]">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            className={cn(
              "flex h-10 items-center rounded-md px-3 text-site-ink/90 transition hover:bg-site-pill",
              active && "bg-site-pill font-semibold text-site-ink"
            )}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            {item.icon ? <item.icon className="mr-2 h-4 w-4" /> : null}
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  siteName,
  tagline,
}: {
  siteName?: string;
  tagline?: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const effectiveSiteName = siteName || t("site.name");
  const effectiveTagline = tagline || t("site.tagline");

  return (
    <>
      <aside className="hidden h-screen w-80 shrink-0 border-r border-site-border bg-site-panel px-6 py-6 lg:block lg:sticky lg:top-0">
        <div className="mb-10">
          <Link className="block text-5xl leading-none text-site-accent font-serif" href="/">
            {effectiveSiteName}
          </Link>
          <p className="mt-1 text-sm text-site-muted">{effectiveTagline}</p>
        </div>

        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-site-muted" />
          <Input className="pl-9 bg-site-pill border-0" placeholder={t("nav.searchPlaceholder")} />
        </div>

        <NavLinks />
      </aside>

      <div className="sticky top-0 z-40 border-b border-site-border bg-site-panel/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link className="font-serif text-4xl leading-none text-site-accent" href="/">
            {effectiveSiteName}
          </Link>
          <Button onClick={() => setOpen((value) => !value)} size="icon" variant="ghost">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {open ? (
          <div className="mt-3 space-y-3 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-site-muted" />
              <Input className="pl-9 bg-white" placeholder={t("nav.searchPlaceholder")} />
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </div>
    </>
  );
}
