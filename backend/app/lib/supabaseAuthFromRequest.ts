import { createClient } from "@supabase/supabase-js";

export async function getUserIdFromBearer(authorization: string | null): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }
  const jwt = authorization.slice(7).trim();
  if (!jwt) {
    return null;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return null;
  }
  const supabase = createClient(url, anon);
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(jwt);
  if (error || !user?.id) {
    return null;
  }
  return user.id;
}
