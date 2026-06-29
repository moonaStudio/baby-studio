import React, { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, textAlign: "center" }}>
          <p>로그인 처리 중…</p>
        </main>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
