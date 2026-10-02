const dueFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDue(iso: string): string {
  return dueFormatter.format(new Date(iso));
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
