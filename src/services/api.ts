import { CONFIG } from "../constants/config";
import { ProcessRequest, ProcessResponse, ThemeRecord } from "../types";

export async function processImage(payload: ProcessRequest): Promise<ProcessResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.PROCESS_TIMEOUT_MS);
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      const rawText = await response.text().catch(() => "");
      let parsed: any;
      try {
        parsed = rawText ? JSON.parse(rawText) : undefined;
      } catch {
        parsed = undefined;
      }
      const message =
        parsed?.message ||
        parsed?.error ||
        rawText ||
        `Processing failed (${response.status})`;
      throw new Error(message);
    }
    return response.json();
  } catch (e: unknown) {
    const name = e && typeof e === "object" && "name" in e ? String((e as { name?: string }).name) : "";
    const msg = e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "";
    if (name === "AbortError" || /abort/i.test(msg)) {
      throw new Error(
        "처리 시간이 길어져 중단됐어요. 네트워크를 확인한 뒤 다시 시도해 주세요. (느린 경우 1~3분까지 걸릴 수 있어요.)"
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchThemes(): Promise<ThemeRecord[]> {
  const response = await fetch(`${CONFIG.BACKEND_URL}/api/themes`);
  if (!response.ok) throw new Error("Failed to fetch themes");
  return response.json();
}
