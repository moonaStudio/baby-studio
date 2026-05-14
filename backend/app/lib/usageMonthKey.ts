/** Calendar month in Asia/Seoul as `YYYY-MM` (matches app “이번 달” for KR users). */
export function usageMonthKeySeoul(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  if (!y || !m) {
    throw new Error("usageMonthKeySeoul: could not format date");
  }
  return `${y}-${m.padStart(2, "0")}`;
}
