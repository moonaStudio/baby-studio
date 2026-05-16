import { CONFIG } from "./config";
import { useAppStore } from "../store";

/** Server `monthlyFreeLimit` when loaded; else app default. */
export function getMonthlyFreeLimit(): number {
  const remote = useAppStore.getState().monthlyFreeLimit;
  return typeof remote === "number" && remote >= 0 ? remote : CONFIG.FREE_MONTHLY_LIMIT;
}
