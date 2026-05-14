"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parseAppReturnFromSearchParam } from "../../lib/billingAppReturnUrl";

function ReturnInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const appReturnRaw = searchParams.get("app_return");

  const target = useMemo(() => {
    if (!sessionId) return null;
    const appBase = parseAppReturnFromSearchParam(appReturnRaw);
    if (appBase) {
      const join = appBase.includes("?") ? "&" : "?";
      return `${appBase}${join}session_id=${encodeURIComponent(sessionId)}`;
    }
    const scheme = process.env.NEXT_PUBLIC_APP_SCHEME ?? "babystudio";
    return `${scheme}://billing/success?session_id=${encodeURIComponent(sessionId)}`;
  }, [sessionId, appReturnRaw]);

  useEffect(() => {
    if (!target) return;
    window.location.replace(target);
  }, [target]);

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
