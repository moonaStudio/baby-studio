import { CONFIG } from "../constants/config";
import { useAppStore } from "../store";

export function useMonthlyFreeLimit(): number {
  const remote = useAppStore((s) => s.monthlyFreeLimit);
  return typeof remote === "number" && remote >= 0 ? remote : CONFIG.FREE_MONTHLY_LIMIT;
}
