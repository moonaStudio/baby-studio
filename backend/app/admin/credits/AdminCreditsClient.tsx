"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "moona_admin_key";

type ManualGrant = {
  id: string;
  user_id: string;
  credits: number;
  note: string;
  user_email?: string | null;
  created_at: string;
};

type PromoCode = {
  code: string;
  label: string;
  credits: number;
  max_total_redemptions: number | null;
  max_per_user: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  redemption_count?: number;
};

export function AdminCreditsClient() {
  const searchParams = useSearchParams();
  const [adminKey, setAdminKey] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [credits, setCredits] = React.useState("1");
  const [note, setNote] = React.useState("인스타 스토리 @moonas 태그");
  const [granting, setGranting] = React.useState(false);
  const [grants, setGrants] = React.useState<ManualGrant[]>([]);

  const [codes, setCodes] = React.useState<PromoCode[]>([]);
  const [newCode, setNewCode] = React.useState("MOONA1");
  const [newLabel, setNewLabel] = React.useState("인스타 이벤트");
  const [newCredits, setNewCredits] = React.useState("1");
  const [newMaxTotal, setNewMaxTotal] = React.useState("");
  const [savingCode, setSavingCode] = React.useState(false);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) setAdminKey(saved);
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const headers = React.useMemo(
    () => ({ "Content-Type": "application/json", "x-admin-key": adminKey.trim() }),
    [adminKey]
  );

  const loadAll = React.useCallback(async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    setError(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, adminKey.trim());
      const [gRes, cRes] = await Promise.all([
        fetch("/api/admin/credits", { headers: { "x-admin-key": adminKey.trim() } }),
        fetch("/api/admin/promo-codes", { headers: { "x-admin-key": adminKey.trim() } })
      ]);
      const gJson = (await gRes.json()) as { grants?: ManualGrant[]; error?: string; message?: string };
      const cJson = (await cRes.json()) as { codes?: PromoCode[]; error?: string; message?: string };
      if (!gRes.ok) throw new Error(gJson.message ?? gJson.error ?? "지급 내역 불러오기 실패");
      if (!cRes.ok) throw new Error(cJson.message ?? cJson.error ?? "코드 불러오기 실패");
      setGrants(gJson.grants ?? []);
      setCodes(cJson.codes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    }
  }, [adminKey]);

  const grantManual = async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    setGranting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          credits: parseInt(credits, 10),
          note: note.trim()
        })
      });
      const j = (await res.json()) as {
        ok?: boolean;
        balance?: number;
        creditsAdded?: number;
        error?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(j.message ?? j.error ?? "지급 실패");
      setMessage(`지급 완료: +${j.creditsAdded}장 (잔액 ${j.balance}장)`);
      setEmail("");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "지급 실패");
    } finally {
      setGranting(false);
    }
  };

  const savePromoCode = async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    setSavingCode(true);
    setError(null);
    setMessage(null);
    try {
      const maxTotal = newMaxTotal.trim() ? parseInt(newMaxTotal, 10) : null;
      const res = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          code: newCode.trim(),
          label: newLabel.trim(),
          credits: parseInt(newCredits, 10),
          maxTotalRedemptions: maxTotal,
          maxPerUser: 1,
          active: true
        })
      });
      const j = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? "저장 실패");
      setMessage(`프로모 코드 ${newCode.trim().toUpperCase()} 저장됨`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSavingCode(false);
    }
  };

  const toggleCode = async (code: PromoCode) => {
    const res = await fetch("/api/admin/promo-codes", {
      method: "PUT",
      headers,
      body: JSON.stringify({
        code: code.code,
        label: code.label,
        credits: code.credits,
        maxTotalRedemptions: code.max_total_redemptions,
        maxPerUser: code.max_per_user,
        startsAt: code.starts_at,
        endsAt: code.ends_at,
        active: !code.active
      })
    });
    if (res.ok) await loadAll();
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 720 }}>
      <p>
        <Link href="/admin">← 운영 홈</Link>
        {" · "}
        <Link href="/admin/users">가입자 목록</Link>
      </p>
      <h1>크레딧 · 이벤트</h1>
      <p style={{ color: "#555", lineHeight: 1.5 }}>
        인스타 스토리 @moonas 확인 후 <strong>수동 지급</strong>. 프로모 코드는 유저가 앱에서 입력하면{" "}
        <strong>자동 지급</strong>됩니다.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <label>
          관리자 비밀번호 (ADMIN_SECRET)
          <br />
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <button type="button" onClick={() => void loadAll()} style={{ marginTop: 12, padding: "8px 16px" }}>
          불러오기
        </button>
      </section>

      {message ? <p style={{ color: "green" }}>{message}</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <section style={{ marginTop: 32 }}>
        <h2>1. 수동 지급 (스토리 @moonas)</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          DM으로 받은 앱 로그인 이메일을 넣고 지급하세요.
        </p>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <input
            placeholder="유저 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="크레딧 (장)"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            style={{ padding: 8, width: 120 }}
          />
          <input
            placeholder="메모"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ padding: 8 }}
          />
          <button type="button" disabled={granting} onClick={() => void grantManual()} style={{ padding: "8px 16px" }}>
            {granting ? "지급 중…" : "크레딧 지급"}
          </button>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>2. 프로모 코드 (자동)</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          앱 「내 정보 → 이벤트 코드」 또는 링크 <code>babystudio://promo?code=MOONA1</code>
        </p>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="코드" style={{ padding: 8 }} />
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="설명" style={{ padding: 8 }} />
          <input
            value={newCredits}
            onChange={(e) => setNewCredits(e.target.value)}
            placeholder="크레딧"
            style={{ padding: 8, width: 120 }}
          />
          <input
            value={newMaxTotal}
            onChange={(e) => setNewMaxTotal(e.target.value)}
            placeholder="선착순 (비우면 무제한)"
            style={{ padding: 8, width: 200 }}
          />
          <button type="button" disabled={savingCode} onClick={() => void savePromoCode()} style={{ padding: "8px 16px" }}>
            {savingCode ? "저장 중…" : "코드 저장"}
          </button>
        </div>

        {codes.length > 0 ? (
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <th align="left">코드</th>
                <th align="left">장</th>
                <th align="left">사용</th>
                <th align="left">상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} style={{ borderTop: "1px solid #eee" }}>
                  <td>{c.code}</td>
                  <td>{c.credits}</td>
                  <td>
                    {c.redemption_count ?? 0}
                    {c.max_total_redemptions ? ` / ${c.max_total_redemptions}` : ""}
                  </td>
                  <td>{c.active ? "ON" : "OFF"}</td>
                  <td>
                    <button type="button" onClick={() => void toggleCode(c)}>
                      {c.active ? "끄기" : "켜기"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>최근 수동 지급</h2>
        {grants.length === 0 ? (
          <p style={{ color: "#888" }}>내역 없음</p>
        ) : (
          <ul style={{ fontSize: 14, lineHeight: 1.6 }}>
            {grants.map((g) => (
              <li key={g.id}>
                {new Date(g.created_at).toLocaleString()} — {g.user_email ?? g.user_id.slice(0, 8)} +{g.credits} ({g.note})
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
