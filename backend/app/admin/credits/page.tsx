import { Suspense } from "react";
import { AdminCreditsClient } from "./AdminCreditsClient";

export default function AdminCreditsPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>불러오는 중…</main>}>
      <AdminCreditsClient />
    </Suspense>
  );
}
