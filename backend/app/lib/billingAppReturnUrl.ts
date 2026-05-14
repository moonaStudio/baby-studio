/** Client-supplied deep link after Checkout; must not be an open redirect. */
const ALLOWED_APP_RETURN = /^(babystudio|exp|exps):\/\//i;
const MAX_LEN = 2048;

export function parseAppReturnFromBody(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const s = raw.trim();
  if (s.length > MAX_LEN) return null;
  if (!ALLOWED_APP_RETURN.test(s)) return null;
  return s;
}

export function parseAppReturnFromSearchParam(raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (decoded.length > MAX_LEN) return null;
  if (!ALLOWED_APP_RETURN.test(decoded)) return null;
  return decoded;
}
