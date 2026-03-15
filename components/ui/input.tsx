import * as React from "react";
import {cn} from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({className, ...props}, ref) => {
    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-site-border bg-white px-3 py-2 text-sm placeholder:text-site-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export {Input};
