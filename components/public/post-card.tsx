import {Clock3} from "lucide-react";
import {Link} from "@/i18n/navigation";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {formatDate} from "@/lib/utils";

type CardProps = {
  slug: string;
  title: string;
  excerpt: string;
  date: Date | null;
  readingTimeMin: number;
  category?: string | null;
  featured?: boolean;
  locale: string;
};

export function PostCard({slug, title, excerpt, date, readingTimeMin, category, featured, locale}: CardProps) {
  return (
    <Card className="h-full">
      <Link className="block p-6" href={`/essay/${slug}`}>
        <div className="mb-4 flex items-center gap-2">
          {featured ? <Badge className="bg-site-featured text-[#bf6b4a]">Featured</Badge> : null}
          {category ? <Badge>{category}</Badge> : null}
        </div>
        <h3 className="mb-3 text-[2.2rem] leading-[1.02] text-site-ink sm:text-[2rem]">{title}</h3>
        <p className="mb-6 line-clamp-3 text-[1.12rem] leading-8 text-site-muted">{excerpt}</p>
        <div className="flex items-center gap-4 text-sm text-site-muted">
          <span>{date ? formatDate(date, locale) : "-"}</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            {readingTimeMin} min
          </span>
        </div>
      </Link>
    </Card>
  );
}
