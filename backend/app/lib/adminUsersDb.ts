import { getSupabaseAdmin } from "./supabaseAdmin";

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
  credits: number;
};

export async function listAdminUsers(options?: { search?: string; limit?: number }): Promise<AdminUserRow[]> {
  const admin = getSupabaseAdmin();
  const search = options?.search?.trim().toLowerCase() ?? "";
  const maxUsers = Math.min(options?.limit ?? 500, 2000);

  const allUsers: AdminUserRow[] = [];
  let page = 1;
  const perPage = 200;

  while (allUsers.length < maxUsers) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    for (const u of data.users) {
      const email = u.email ?? null;
      if (search) {
        const hay = `${email ?? ""} ${u.id}`.toLowerCase();
        if (!hay.includes(search)) continue;
      }

      const provider =
        u.app_metadata?.provider ??
        (Array.isArray(u.identities) && u.identities[0]?.provider ? u.identities[0].provider : "unknown");

      allUsers.push({
        id: u.id,
        email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        provider: String(provider),
        credits: 0
      });

      if (allUsers.length >= maxUsers) break;
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  const ids = allUsers.map((u) => u.id);
  if (ids.length === 0) return allUsers;

  const { data: creditRows, error: creditErr } = await admin
    .from("user_credits")
    .select("user_id, credits")
    .in("user_id", ids);
  if (creditErr) throw new Error(creditErr.message);

  const creditMap = new Map<string, number>();
  for (const row of creditRows ?? []) {
    creditMap.set(row.user_id as string, row.credits as number);
  }

  return allUsers.map((u) => ({ ...u, credits: creditMap.get(u.id) ?? 0 }));
}
