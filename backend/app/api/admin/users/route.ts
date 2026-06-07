import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminAuthorized } from "../../../lib/adminAuth";
import { listAdminUsers } from "../../../lib/adminUsersDb";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const users = await listAdminUsers({ search });
    return NextResponse.json({ count: users.length, users });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
