"use client";

import React from "react";
import Link from "next/link";

const STORAGE_KEY = "moona_admin_key";

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
  credits: number;
};

export function AdminUsersClient() {
  const [adminKey, setAdminKey] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) setAdminKey(saved);
  }, []);

  const load = React.useCallback(async () => {
    if (!adminKey.trim()) {
      setError("관리자 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, adminKey.trim());
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/admin/users${q}`, {
        headers: { "x-admin-key": adminKey.trim() }
      });
      const j = (await res.json()) as { users?: UserRow[]; count?: number; error?: string; message?: string };
      if (!res.ok) throw new Error(j.message ?? j.error ?? `불러오기 실패 (${res.status})`);
      setUsers(j.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [adminKey, search]);

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("복사에 실패했어요.");
    }
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 960 }}>
      <p>
        <Link href="/admin">← 운영 홈</Link>
      </p>
      <h1>가입자 목록</h1>
      <p style={{ color: "#555", lineHeight: 1.5 }}>
        Supabase에 등록된 계정 이메일입니다. 크레딧 지급은{" "}
        <Link href="/admin/credits">크레딧 · 이벤트</Link> 페이지에서 하세요.
      </p>

      <section style={{ marginTop: 20, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <label>
          관리자 비밀번호
          <br />
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: 12 }}>
          검색 (이메일 또는 user id)
          <br />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="gmail.com"
            style={{ width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <button type="button" onClick={() => void load()} disabled={loading} style={{ marginTop: 12, padding: "8px 16px" }}>
          {loading ? "불러오는 중…" : "불러오기"}
        </button>
      </section>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {copied ? <p style={{ color: "green" }}>복사됨: {copied}</p> : null}

      {users.length > 0 ? (
        <>
          <p style={{ marginTop: 16, color: "#666" }}>{users.length}명</p>
          <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: 8 }}>이메일</th>
                <th style={{ padding: 8 }}>크레딧</th>
                <th style={{ padding: 8 }}>로그인</th>
                <th style={{ padding: 8 }}>가입일</th>
                <th style={{ padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{u.email ?? "(이메일 없음)"}</td>
                  <td style={{ padding: 8 }}>{u.credits}장</td>
                  <td style={{ padding: 8 }}>{u.provider}</td>
                  <td style={{ padding: 8 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: 8 }}>
                    {u.email ? (
                      <>
                        <button type="button" onClick={() => void copyEmail(u.email!)}>
                          복사
                        </button>{" "}
                        <Link href={`/admin/credits?email=${encodeURIComponent(u.email)}`}>지급</Link>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </main>
  );
}
