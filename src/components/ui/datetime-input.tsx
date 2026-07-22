import * as React from "react";
import { Calendar } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

/**
 * A `type="datetime-local"` input with our own calendar icon drawn on top.
 * The native picker-indicator glyph Chromium/Edge draws is styled purely by
 * OS/browser chrome (not by `color`/`fill`), and on this app's dark theme it
 * renders nearly invisible - so instead we make the real native indicator
 * transparent-but-still-clickable and overlay a themed Lucide icon in the
 * same spot, purely decorative (`pointer-events-none`) so clicks still land
 * on the native hit target underneath.
 */
const DateTimeInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          type="datetime-local"
          className={cn(
            "pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
            className,
          )}
          ref={ref}
          {...props}
        />
        <Calendar
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  },
);
DateTimeInput.displayName = "DateTimeInput";

export { DateTimeInput };
