import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminAuthorized } from "../../../../lib/adminAuth";
import { uploadThemeAsset } from "../../../../lib/themeCatalogDb";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const form = await req.formData();
    const slug = String(form.get("slug") ?? "").trim();
    const kind = String(form.get("kind") ?? "").trim();
    const file = form.get("file");
    if (!slug || (kind !== "preview" && kind !== "background")) {
      return NextResponse.json({ error: "slug and kind (preview|background) required" }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const contentType = file.type || "image/png";
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length < 1) {
      return NextResponse.json({ error: "empty file" }, { status: 400 });
    }
    const url = await uploadThemeAsset(slug, kind, bytes, contentType);
    return NextResponse.json({ url, kind });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
