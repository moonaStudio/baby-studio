import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminAuthorized } from "../../../lib/adminAuth";
import { deleteTheme, listAllThemesAdmin, upsertTheme } from "../../../lib/themeCatalogDb";
import { normalizeFaceSlot } from "../../../lib/themeTypes";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const themes = await listAllThemesAdmin();
    return NextResponse.json({ themes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load themes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const body = (await req.json()) as {
      slug?: string;
      name?: string;
      category?: string;
      gender?: "girl" | "boy" | "unisex";
      defaultIsPremium?: boolean;
      isPublished?: boolean;
      previewUrl?: string | null;
      backgroundUrl?: string;
      faceSlot?: unknown;
      colorProfile?: "warm" | "cool" | "neutral";
      sortOrder?: number;
    };
    if (!body.slug?.trim() || !body.name?.trim()) {
      return NextResponse.json({ error: "slug and name required" }, { status: 400 });
    }
    const theme = await upsertTheme({
      slug: body.slug,
      name: body.name,
      category: body.category ?? "other",
      gender: body.gender ?? "unisex",
      defaultIsPremium: body.defaultIsPremium ?? true,
      isPublished: body.isPublished ?? false,
      previewUrl: body.previewUrl ?? null,
      backgroundUrl: body.backgroundUrl ?? "",
      faceSlot: normalizeFaceSlot(body.faceSlot),
      colorProfile: body.colorProfile ?? "neutral",
      sortOrder: body.sortOrder ?? 0
    });
    return NextResponse.json({ theme });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save theme";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const slug = new URL(req.url).searchParams.get("slug")?.trim();
    if (!slug) {
      return NextResponse.json({ error: "slug query required" }, { status: 400 });
    }
    await deleteTheme(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
