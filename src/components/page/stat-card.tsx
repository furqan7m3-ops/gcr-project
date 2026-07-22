import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
  /** When set, the whole card navigates to this route - e.g. a "Users" count linking to /admin/users. */
  href?: string;
}

export function StatCard({ label, value, icon: Icon, hint, className, href }: StatCardProps) {
  const body = (
    <CardContent className="flex items-start justify-between gap-4 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {Icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
        </div>
      ) : null}
    </CardContent>
  );

  const cardClassName = cn(
    "transition-shadow hover:shadow-md",
    href
      ? "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      : null,
    className,
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl" aria-label={`${label}: ${value}`}>
        <Card className={cardClassName}>{body}</Card>
      </Link>
    );
  }

  return <Card className={cardClassName}>{body}</Card>;
}
