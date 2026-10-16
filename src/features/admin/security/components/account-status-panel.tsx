import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabels } from "@/features/admin/users/lib/user-display";

import type { AccountStatusBreakdownItem } from "../types";

export function AccountStatusPanel({ items }: { items: AccountStatusBreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.status} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{statusLabels[item.status]}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
