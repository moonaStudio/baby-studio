export function isAdminAuthorized(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("x-admin-key")?.trim();
  return header === secret;
}

export function adminUnauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
