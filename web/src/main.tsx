import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Phase 1 placeholder: proves the dashboard can reach the API. Approval queue lands in Phase 3.
function App() {
  const [health, setHealth] = useState<string>('checking…');
  useEffect(() => {
    fetch('/health')
      .then((r) => r.json())
      .then((j) => setHealth(JSON.stringify(j)))
      .catch(() => setHealth('API unreachable'));
  }, []);
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>threads-affiliate</h1>
      <p>API health: {health}</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
