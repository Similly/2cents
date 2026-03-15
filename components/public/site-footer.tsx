"use client";

import {useTranslations} from "next-intl";

type FooterLinks = {
  twitter?: string;
  email?: string;
  website?: string;
};

export function SiteFooter({links}: {links?: FooterLinks}) {
  const t = useTranslations("footer");
  const twitterHref = links?.twitter?.trim() || "#";
  const emailHref = links?.email?.trim() || "mailto:hello@example.com";
  const websiteHref = links?.website?.trim() || "/";

  return (
    <footer className="mt-16 border-t border-site-border pt-6 text-sm text-site-muted">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p>{t("copyright")}</p>
        <div className="flex items-center gap-6">
          <a href="/rss.xml" className="hover:text-site-accent">{t("rss")}</a>
          <a href={twitterHref} rel="noopener noreferrer" target={twitterHref.startsWith("http") ? "_blank" : undefined} className="hover:text-site-accent">{t("twitter")}</a>
          <a href={emailHref} className="hover:text-site-accent">{t("email")}</a>
          <a href={websiteHref} rel="noopener noreferrer" target={websiteHref.startsWith("http") ? "_blank" : undefined} className="hover:text-site-accent">Web</a>
        </div>
      </div>
    </footer>
  );
}
