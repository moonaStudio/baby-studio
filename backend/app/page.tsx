export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Baby Studio Backend</h1>
      <p>Server is running.</p>
      <p>Try:</p>
      <ul>
        <li>
          <code>/api/themes</code>
        </li>
        <li>
          <code>/api/process</code> (POST)
        </li>
      </ul>
    </main>
  );
}
