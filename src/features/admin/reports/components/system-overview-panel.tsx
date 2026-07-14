import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { StatusBreakdownItem, SystemOverview } from "../types";

function Meter({ items }: { items: StatusBreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SystemOverviewPanel({ overview }: { overview: SystemOverview }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Users by status</CardTitle>
        </CardHeader>
        <CardContent>
          <Meter items={overview.userStatusBreakdown} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Classrooms by status</CardTitle>
        </CardHeader>
        <CardContent>
          <Meter items={overview.classroomStatusBreakdown} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Submissions by status</CardTitle>
        </CardHeader>
        <CardContent>
          <Meter items={overview.submissionStatusBreakdown} />
        </CardContent>
      </Card>
    </div>
  );
}
