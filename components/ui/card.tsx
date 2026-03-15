import {cn} from "@/lib/utils";

export function Card({children, className}: {children: React.ReactNode; className?: string}) {
  return <article className={cn("rounded-xl border border-site-border bg-white", className)}>{children}</article>;
}
