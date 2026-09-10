async function loadHealth() {
  const badge = document.getElementById('connection-badge');
  const text = document.getElementById('connection-text');
  const version = document.getElementById('api-version');

  try {
    const res = await fetch('/health');
    const data = await res.json();
    badge.className = 'badge online';
    text.textContent = 'Server Online';
    version.textContent = `v${data.version}`;
  } catch {
    badge.className = 'badge checking';
    text.textContent = 'Eroare conexiune';
    version.textContent = 'N/A';
  }
}

async function loadBooks() {
  const list = document.getElementById('books-list');
  const count = document.getElementById('books-count');

  try {
    const res = await fetch('/api/books');
    const books = await res.json();
    count.textContent = books.length;

    if (books.length === 0) {
      list.innerHTML = '<p class="empty-text">Nicio carte înregistrată încă. Fii primul care adaugă una!</p>';
      return;
    }

    list.innerHTML = books.map(b => `
      <div class="book-card">
        <div class="book-title">${escapeHtml(b.title)}</div>
        <div class="book-author">de ${escapeHtml(b.author)}</div>
        <div class="book-tags">
          <span class="book-tag">${escapeHtml(b.genre)}</span>
          <span class="book-tag">${escapeHtml(b.condition)}</span>
          <span class="book-tag">📍 ${escapeHtml(b.city)}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="empty-text">Eroare la încărcarea cărților.</p>';
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

document.getElementById('book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Se salvează...';

  const payload = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    genre: document.getElementById('genre').value || 'General',
    condition: document.getElementById('condition').value,
    city: document.getElementById('city').value || 'România'
  };

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Eroare la adăugare');

    document.getElementById('book-form').reset();
    await loadBooks();
  } catch (err) {
    alert('Nu s-a putut salva cartea. Verifică conexiunea.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Adaugă în catalog';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadHealth();
  loadBooks();
});
