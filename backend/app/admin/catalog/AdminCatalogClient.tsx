"use client";

import React from "react";

const STORAGE_KEY = "moona_admin_key";

type ThemeDto = {
  slug: string;
  name: string;
  category: string;
  gender: "girl" | "boy" | "unisex";
  defaultIsPremium: boolean;
  isPublished: boolean;
  previewUrl: string | null;
  backgroundUrl: string;
  faceSlot: { x: number; y: number; width: number; height: number; feather: number };
  colorProfile: "warm" | "cool" | "neutral";
  sortOrder: number;
};

const emptyForm = (): ThemeDto => ({
  slug: "",
  name: "",
  category: "other",
  gender: "unisex",
  defaultIsPremium: true,
  isPublished: false,
  previewUrl: null,
  backgroundUrl: "",
  faceSlot: { x: 0.5, y: 0.4, width: 0.22, height: 0.28, feather: 0.1 },
  colorProfile: "neutral",
  sortOrder: 0
});

export function AdminCatalogClient() {
  const [adminKey, setAdminKey] = React.useState("");
  const [themes, setThemes] = React.useState<ThemeDto[]>([]);
  const [form, setForm] = React.useState<ThemeDto>(emptyForm);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setAdminKey(saved);
  }, []);

  const headers = () => ({
    "x-admin-key": adminKey.trim(),
    "Content-Type": "application/json"
  });

  const load = async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/themes-catalog", { headers: { "x-admin-key": adminKey.trim() } });
      const j = (await res.json()) as { themes?: ThemeDto[]; error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? `불러오기 실패 (${res.status})`);
      sessionStorage.setItem(STORAGE_KEY, adminKey.trim());
      setThemes(j.themes ?? []);
      setMessage(`원격 테마 ${j.themes?.length ?? 0}개`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    if (!form.backgroundUrl.trim()) {
      setError("배경 이미지 URL이 필요해요. 아래에서 배경을 업로드하세요.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/themes-catalog", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(form)
      });
      const j = (await res.json()) as { theme?: ThemeDto; error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? `저장 실패 (${res.status})`);
      if (j.theme) setForm(j.theme);
      await load();
      setMessage(`저장됨: ${form.slug}${form.isPublished ? " (앱에 공개)" : " (비공개)"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (kind: "preview" | "background", file: File | null) => {
    if (!file || !adminKey.trim() || !form.slug.trim()) {
      setError("slug를 먼저 입력한 뒤 업로드하세요.");
      return;
    }
    setUploading(kind);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("slug", form.slug.trim());
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/admin/themes-catalog/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey.trim() },
        body: fd
      });
      const j = (await res.json()) as { url?: string; error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? "업로드 실패");
      if (kind === "background") {
        setForm((f) => ({ ...f, backgroundUrl: j.url ?? f.backgroundUrl }));
      } else {
        setForm((f) => ({ ...f, previewUrl: j.url ?? f.previewUrl }));
      }
      setMessage(`${kind} 업로드 완료`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(null);
    }
  };

  const remove = async (slug: string) => {
    if (!confirm(`테마 "${slug}"를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/themes-catalog?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey.trim() }
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? "삭제 실패");
      return;
    }
    await load();
    if (form.slug === slug) setForm(emptyForm());
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h1>원격 테마 추가·수정</h1>
      <p style={{ color: "#555" }}>
        새 테마는 앱 업데이트 없이 추가됩니다. slug는 영문 소문자·하이픈만. 배경 업로드 후 <strong>게시</strong>를 켜야 앱에
        보입니다.
      </p>
      <p>
        <a href="/admin/themes">← 월별 무료/프리미엄 설정</a>
      </p>

      <label style={{ display: "block", marginBottom: 12 }}>
        관리자 비밀번호
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
        />
      </label>
      <button type="button" onClick={() => void load()} disabled={loading}>
        {loading ? "불러오는 중…" : "목록 불러오기"}
      </button>

      {message ? <p style={{ color: "#0a7" }}>{message}</p> : null}
      {error ? <p style={{ color: "#c00" }}>{error}</p> : null}

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>{form.slug ? `편집: ${form.slug}` : "새 테마"}</h2>
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            slug (고유 ID)
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="summer-beach-girl"
              style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            이름
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            카테고리
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="months, 100day, newborn…"
              style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            성별
            <select
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({ ...f, gender: e.target.value as ThemeDto["gender"] }))
              }
              style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
            >
              <option value="unisex">unisex</option>
              <option value="girl">girl</option>
              <option value="boy">boy</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.defaultIsPremium}
              onChange={(e) => setForm((f) => ({ ...f, defaultIsPremium: e.target.checked }))}
            />{" "}
            기본 프리미엄
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />{" "}
            앱에 게시
          </label>
          <label>
            정렬 순서
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              style={{ display: "block", width: 120, marginTop: 4, padding: 8 }}
            />
          </label>
          <fieldset style={{ border: "1px solid #eee", padding: 12 }}>
            <legend>얼굴 슬롯 (0~1 비율)</legend>
            {(["x", "y", "width", "height", "feather"] as const).map((k) => (
              <label key={k} style={{ display: "inline-block", marginRight: 12 }}>
                {k}
                <input
                  type="number"
                  step="0.01"
                  value={form.faceSlot[k]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      faceSlot: { ...f.faceSlot, [k]: Number(e.target.value) }
                    }))
                  }
                  style={{ width: 72, marginLeft: 4 }}
                />
              </label>
            ))}
          </fieldset>
          <div>
            <strong>배경 이미지 (합성용)</strong>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void upload("background", e.target.files?.[0] ?? null)}
              style={{ display: "block", marginTop: 6 }}
            />
            {uploading === "background" ? <span> 업로드 중…</span> : null}
            {form.backgroundUrl ? (
              <p style={{ fontSize: 12, wordBreak: "break-all" }}>{form.backgroundUrl}</p>
            ) : null}
          </div>
          <div>
            <strong>미리보기 (목록용, 선택)</strong>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void upload("preview", e.target.files?.[0] ?? null)}
              style={{ display: "block", marginTop: 6 }}
            />
            {uploading === "preview" ? <span> 업로드 중…</span> : null}
            {form.previewUrl ? (
              <p style={{ fontSize: 12, wordBreak: "break-all" }}>{form.previewUrl}</p>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
            <button type="button" onClick={() => setForm(emptyForm())}>
              새 테마 폼
            </button>
          </div>
        </div>
      </section>

      <h2 style={{ marginTop: 32 }}>등록된 원격 테마</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {themes.map((t) => (
          <li
            key={t.slug}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              background: t.isPublished ? "#f0fff4" : "#fafafa"
            }}
          >
            <strong>{t.name}</strong> <code>{t.slug}</code>
            {t.isPublished ? " · 게시됨" : " · 비공개"}
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setForm(t)}>
                편집
              </button>
              <button type="button" onClick={() => void remove(t.slug)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
