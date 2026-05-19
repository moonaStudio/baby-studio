"use client";

import React from "react";

type ThemeRow = {
  slug: string;
  name: string;
  category: string;
  defaultIsPremium: boolean;
  isPremium: boolean;
  hasOverride: boolean;
};

type AdminPayload = {
  month: string;
  monthlyFreeLimit: number;
  themes: ThemeRow[];
};

const STORAGE_KEY = "moona_admin_key";

export function AdminThemesClient() {
  const [adminKey, setAdminKey] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [monthlyFreeLimit, setMonthlyFreeLimit] = React.useState(5);
  const [themes, setThemes] = React.useState<ThemeRow[]>([]);
  const [filter, setFilter] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [serverStatus, setServerStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) setAdminKey(saved);
    void fetch("/api/admin/status")
      .then((r) => r.json())
      .then((j: { adminConfigured?: boolean; hint?: string }) => {
        if (j.adminConfigured === false) {
          setServerStatus(
            "⚠️ 이 배포(Vercel Production)에 ADMIN_SECRET이 아직 없습니다. Vercel 환경 변수에 넣고 Redeploy 해 주세요."
          );
        } else if (j.adminConfigured === true) {
          setServerStatus("✓ 서버에 ADMIN_SECRET이 설정되어 있어요. 아래 비밀번호는 Vercel과 동일해야 합니다.");
        }
      })
      .catch(() => undefined);
  }, []);

  const load = React.useCallback(async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const q = month.trim() ? `?month=${encodeURIComponent(month.trim())}` : "";
      const res = await fetch(`/api/admin/theme-promotions${q}`, {
        headers: { "x-admin-key": adminKey.trim() }
      });
      const j = (await res.json()) as AdminPayload & { error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? `불러오기 실패 (${res.status})`);
      sessionStorage.setItem(STORAGE_KEY, adminKey.trim());
      setMonth(j.month);
      setMonthlyFreeLimit(j.monthlyFreeLimit);
      setThemes(j.themes);
      setMessage(`${j.month} 설정을 불러왔어요.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [adminKey, month]);

  const save = async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    if (!month.trim() || !/^\d{4}-\d{2}$/.test(month.trim())) {
      setError("월은 YYYY-MM 형식이어야 해요 (예: 2026-05).");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/theme-promotions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim()
        },
        body: JSON.stringify({
          month: month.trim(),
          monthlyFreeLimit,
          themes: themes.map((t) => ({ slug: t.slug, isPremium: t.isPremium }))
        })
      });
      const j = (await res.json()) as AdminPayload & { error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? `저장 실패 (${res.status})`);
      setThemes(j.themes);
      setMonthlyFreeLimit(j.monthlyFreeLimit);
      setMessage(`${j.month} 설정을 저장했어요. 앱은 다시 열거나 테마 탭으로 들어가면 반영돼요.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const toggleFree = (slug: string) => {
    setThemes((prev) =>
      prev.map((t) => (t.slug === slug ? { ...t, isPremium: !t.isPremium, hasOverride: true } : t))
    );
  };

  const resetToDefaults = () => {
    setThemes((prev) =>
      prev.map((t) => ({ ...t, isPremium: t.defaultIsPremium, hasOverride: false }))
    );
  };

  const filtered = themes.filter((t) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || t.category.includes(q);
  });

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Moona 테마 운영</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        이번 달 무료/프리미엄 테마와 월 무료 장수를 바꿉니다. 앱 스토어 재배포 없이 반영돼요.{" "}
        <a href="/admin/catalog">원격 테마 추가</a>
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <label>
          관리자 비밀번호 (서버 <code>ADMIN_SECRET</code>)
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
            autoComplete="current-password"
          />
        </label>
        <label>
          대상 월 (비우면 서울 기준 이번 달)
          <input
            type="text"
            placeholder="2026-05"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label>
          월 무료 생성 장수
          <input
            type="number"
            min={0}
            max={99}
            value={monthlyFreeLimit}
            onChange={(e) => setMonthlyFreeLimit(Number(e.target.value))}
            style={{ display: "block", width: 160, marginTop: 4, padding: 8 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "불러오는 중…" : "불러오기"}
          </button>
          <button type="button" onClick={() => void save()} disabled={saving || themes.length === 0}>
            {saving ? "저장 중…" : "저장"}
          </button>
          <button type="button" onClick={resetToDefaults} disabled={themes.length === 0}>
            앱 기본값으로 되돌리기
          </button>
        </div>
      </section>

      {serverStatus ? <p style={{ color: "#555", fontSize: 14 }}>{serverStatus}</p> : null}
      {message ? <p style={{ color: "#0a7" }}>{message}</p> : null}
      {error ? <p style={{ color: "#c00", whiteSpace: "pre-wrap" }}>{error}</p> : null}

      {themes.length > 0 ? (
        <>
          <input
            type="search"
            placeholder="테마 검색…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
          <p style={{ fontSize: 14, color: "#666" }}>
            체크 = <strong>무료</strong> (이번 달). 해제 = 프리미엄(크레딧/구독 필요). 기본과 다르면 파란 테두리.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filtered.map((t) => {
              const isFree = !t.isPremium;
              const differs = t.isPremium !== t.defaultIsPremium;
              return (
                <li
                  key={t.slug}
                  style={{
                    border: `1px solid ${differs ? "#6b9fff" : "#ddd"}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 8,
                    background: isFree ? "#f0fff4" : "#fff"
                  }}
                >
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={() => toggleFree(t.slug)}
                      style={{ marginTop: 4 }}
                    />
                    <span>
                      <strong>{t.name}</strong>
                      <br />
                      <code style={{ fontSize: 12 }}>{t.slug}</code>
                      <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>{t.category}</span>
                      <br />
                      <span style={{ fontSize: 12, color: "#666" }}>
                        앱 기본: {t.defaultIsPremium ? "프리미엄" : "무료"}
                        {differs ? " · 이번 달 덮어씀" : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </main>
  );
}
