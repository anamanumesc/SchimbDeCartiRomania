document.addEventListener('DOMContentLoaded', async () => {
  const badge = document.getElementById('connection-badge');
  const text = document.getElementById('connection-text');
  const version = document.getElementById('api-version');
  const db = document.getElementById('db-status');

  try {
    const res = await fetch('/health');
    const data = await res.json();
    
    badge.className = 'badge online';
    text.textContent = 'Server Online';
    version.textContent = `v${data.version}`;
    db.textContent = data.database === 'connected' ? 'Activă' : 'Offline';
  } catch (err) {
    badge.className = 'badge checking';
    text.textContent = 'Eroare conexiune';
    version.textContent = 'N/A';
    db.textContent = 'N/A';
  }
});
