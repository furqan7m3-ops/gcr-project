import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { GrowthPoint } from "../types";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 12;
const PADDING_Y = 24;

// timeZone is pinned to UTC (not the runtime's local zone) so this renders
// identically on the server and in every client's browser regardless of
// either side's system timezone - otherwise a weekStart near a day boundary
// can format as a different calendar day on each side, causing a hydration
// mismatch in the <title> text below.
const weekFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function buildPath(values: number[], maxValue: number): string {
  if (values.length === 0) {
    return "";
  }

  const usableWidth = WIDTH - PADDING_X * 2;
  const usableHeight = HEIGHT - PADDING_Y * 2;
  const xStep = values.length > 1 ? usableWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = PADDING_X + index * xStep;
      const y = PADDING_Y + usableHeight - (value / maxValue) * usableHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildPoints(
  values: number[],
  maxValue: number,
): { x: number; y: number; value: number }[] {
  const usableWidth = WIDTH - PADDING_X * 2;
  const usableHeight = HEIGHT - PADDING_Y * 2;
  const xStep = values.length > 1 ? usableWidth / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: PADDING_X + index * xStep,
    y: PADDING_Y + usableHeight - (value / maxValue) * usableHeight,
    value,
  }));
}

export function PlatformGrowthChart({ growth }: { growth: GrowthPoint[] }) {
  const userValues = growth.map((point) => point.userSignups);
  const classroomValues = growth.map((point) => point.classroomsCreated);
  const maxValue = Math.max(1, ...userValues, ...classroomValues);

  const userPath = buildPath(userValues, maxValue);
  const classroomPath = buildPath(classroomValues, maxValue);
  const userPoints = buildPoints(userValues, maxValue);
  const classroomPoints = buildPoints(classroomValues, maxValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform growth</CardTitle>
        <CardDescription>New users and classrooms created per week, last 12 weeks.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
            <span className="text-muted-foreground">User signups</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary-foreground/70" aria-hidden />
            <span className="text-muted-foreground">Classrooms created</span>
          </span>
        </div>

        {growth.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Line chart of weekly user signups and classrooms created over the last 12 weeks"
          >
            <line
              x1={PADDING_X}
              y1={HEIGHT - PADDING_Y}
              x2={WIDTH - PADDING_X}
              y2={HEIGHT - PADDING_Y}
              className="stroke-border"
              strokeWidth={1}
            />
            <path d={userPath} fill="none" className="stroke-primary" strokeWidth={2} />
            <path
              d={classroomPath}
              fill="none"
              className="stroke-secondary-foreground/70"
              strokeWidth={2}
            />
            {userPoints.map((point, index) => (
              <circle
                key={`user-${index}`}
                cx={point.x}
                cy={point.y}
                r={3}
                className="fill-primary"
              >
                <title>
                  {weekFormatter.format(growth[index].weekStart)}: {point.value} user signup
                  {point.value === 1 ? "" : "s"}
                </title>
              </circle>
            ))}
            {classroomPoints.map((point, index) => (
              <circle
                key={`classroom-${index}`}
                cx={point.x}
                cy={point.y}
                r={3}
                className="fill-secondary-foreground/70"
              >
                <title>
                  {weekFormatter.format(growth[index].weekStart)}: {point.value} classroom
                  {point.value === 1 ? "" : "s"} created
                </title>
              </circle>
            ))}
          </svg>
        )}

        {growth.length > 0 ? (
          <details className="text-sm">
            <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
              View as table
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-1 pr-4 font-medium">Week of</th>
                    <th className="py-1 pr-4 font-medium">User signups</th>
                    <th className="py-1 font-medium">Classrooms created</th>
                  </tr>
                </thead>
                <tbody>
                  {growth.map((point) => (
                    <tr key={point.weekStart.toISOString()} className="border-t border-border">
                      <td className="py-1 pr-4 text-foreground">
                        {weekFormatter.format(point.weekStart)}
                      </td>
                      <td className="py-1 pr-4 text-muted-foreground">{point.userSignups}</td>
                      <td className="py-1 text-muted-foreground">{point.classroomsCreated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
