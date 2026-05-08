"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function ReturnInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) return;
    const scheme = process.env.NEXT_PUBLIC_APP_SCHEME ?? "babystudio";
    const target = `${scheme}://billing/success?session_id=${encodeURIComponent(sessionId)}`;
    window.location.replace(target);
  }, [sessionId]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>결제가 완료되면 앱으로 돌아갑니다…</p>
      {!sessionId ? <p>세션 정보가 없습니다. 앱으로 돌아가 주세요.</p> : null}
    </main>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>로딩…</main>}>
      <ReturnInner />
    </Suspense>
  );
}
