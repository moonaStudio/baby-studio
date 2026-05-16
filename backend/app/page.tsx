export default function HomePage() {
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
