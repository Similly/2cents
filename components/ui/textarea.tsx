import * as React from "react";
import {cn} from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-md border border-site-border bg-white px-3 py-2 text-sm placeholder:text-site-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export {Textarea};
