"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

const APP_SCHEME = "babystudio";

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error_description") ?? searchParams.get("error");

  React.useEffect(() => {
    if (!code || error) return;
    const deepLink = `${APP_SCHEME}://auth/callback?code=${encodeURIComponent(code)}`;
    const timer = window.setTimeout(() => {
      window.location.href = deepLink;
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [code, error]);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: 32,
        maxWidth: 420,
        margin: "40px auto",
        textAlign: "center"
      }}
    >
      {error ? (
        <>
          <h1 style={{ color: "#4C113F" }}>로그인 실패</h1>
          <p style={{ color: "#8A5A7B" }}>{error}</p>
        </>
      ) : code ? (
        <>
          <h1 style={{ color: "#4C113F" }}>로그인 완료</h1>
          <p style={{ color: "#8A5A7B" }}>잠시 후 앱으로 돌아갑니다…</p>
          <p style={{ color: "#8A5A7B", fontSize: 14, marginTop: 24 }}>
            앱이 열리지 않으면 Moona Studio 앱을 직접 실행해 주세요.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ color: "#4C113F" }}>로그인 처리 중</h1>
          <p style={{ color: "#8A5A7B" }}>잠시만 기다려 주세요.</p>
        </>
      )}
    </main>
  );
}
