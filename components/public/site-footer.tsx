"use client";

import {useTranslations} from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 border-t border-site-border pt-6 text-sm text-site-muted">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p>{t("copyright")}</p>
        <div className="flex items-center gap-6">
          <a href="/rss.xml" className="hover:text-site-accent">{t("rss")}</a>
          <a href="#" className="hover:text-site-accent">{t("twitter")}</a>
          <a href="mailto:hello@example.com" className="hover:text-site-accent">{t("email")}</a>
        </div>
      </div>
    </footer>
  );
}
