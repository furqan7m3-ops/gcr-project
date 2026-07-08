export function formatDueDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}
