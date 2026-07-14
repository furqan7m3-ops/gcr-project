const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function formatDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : "—";
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatGrade(value: number | null): string {
  return value === null ? "—" : (Math.round(value * 10) / 10).toString();
}

export function formatDaysAgo(days: number | null): string {
  if (days === null) {
    return "—";
  }
  if (days <= 0) {
    return "Today";
  }
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
