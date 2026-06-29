import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.code || params.error) {
    const q = new URLSearchParams();
    if (params.code) q.set("code", params.code);
    if (params.error) q.set("error", params.error);
    if (params.error_description) q.set("error_description", params.error_description);
    redirect(`/auth/callback?${q.toString()}`);
  }

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Moona Studio Backend</h1>
      <p>Server is running.</p>
      <p>Try:</p>
      <ul>
        <li>
          <code>/api/themes</code>
        </li>
        <li>
          <code>/api/themes/promotions</code> (앱 원격 설정)
        </li>
        <li>
          <code>/api/process</code> (POST)
        </li>
        <li>
          <a href="/admin/themes">운영 어드민 (테마·무료 장수)</a>
        </li>
      </ul>
    </main>
  );
}
