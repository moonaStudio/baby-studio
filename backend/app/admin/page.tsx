import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Moona 운영</h1>
      <ul>
        <li>
          <Link href="/admin/themes">테마 · 월 무료 설정</Link>
        </li>
        <li>
          <Link href="/admin/catalog">원격 테마 추가·수정</Link>
        </li>
      </ul>
    </main>
  );
}
