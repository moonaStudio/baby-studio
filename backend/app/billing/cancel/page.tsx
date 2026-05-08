"use client";

import { useEffect } from "react";

export default function BillingCancelPage() {
  useEffect(() => {
    const scheme = process.env.NEXT_PUBLIC_APP_SCHEME ?? "babystudio";
    window.location.replace(`${scheme}://billing/cancel`);
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>결제를 취소했습니다. 앱으로 돌아갑니다…</p>
    </main>
  );
}
