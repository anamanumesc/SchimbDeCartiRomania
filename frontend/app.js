let debounceTimer = null;
let allAvailableBooks = [];

async function loadHealth() {
  const badge = document.getElementById("connection-badge");
  const text = document.getElementById("connection-text");
  const version = document.getElementById("api-version");
  try {
    const res = await fetch("/health");
    const data = await res.json();
    badge.className = "badge online";
    text.textContent = "Server Online";
    version.textContent = "v" + data.version;
  } catch {
    badge.className = "badge checking";
    text.textContent = "Eroare conexiune";
    version.textContent = "N/A";
  }
}

async function loadBooks() {
  const list = document.getElementById("books-list");
  const count = document.getElementById("books-count");

  const q = document.getElementById("search-input").value.trim();
  const genre = document.getElementById("filter-genre").value.trim();
  const city = document.getElementById("filter-city").value.trim();

  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (genre) params.append("genre", genre);
  if (city) params.append("city", city);

  try {
    const res = await fetch("/api/books?" + params.toString());
    const books = await res.json();
    allAvailableBooks = books;
    count.textContent = books.length;

    if (books.length === 0) {
      list.innerHTML = '<p class="empty-text">Nu există cărți conform filtrelor selectate.</p>';
      return;
    }

    list.innerHTML = books.map(b => `
      <div class="book-card">
        <div>
          <div class="book-title">${escapeHtml(b.title)}</div>
          <div class="book-author">de ${escapeHtml(b.author)}</div>
          <div class="book-tags" style="margin-top: 8px;">
            <span class="book-tag">${escapeHtml(b.genre)}</span>
            <span class="book-tag">${escapeHtml(b.condition)}</span>
            <span class="book-tag">📍 ${escapeHtml(b.city)}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-small" onclick="openExchangeModal(${b.id}, '${escapeHtml(b.title).replace(/'/g, "\\'")}')">
          Propune Schimb
        </button>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = '<p class="empty-text">Eroare la încărcarea catalogului.</p>';
  }
}

async function loadExchanges() {
  const container = document.getElementById("exchanges-list");
  const countBadge = document.getElementById("exchanges-count");

  try {
    const res = await fetch("/api/exchanges");
    const exchanges = await res.json();
    countBadge.textContent = exchanges.length;

    if (exchanges.length === 0) {
      container.innerHTML = '<p class="empty-text">Nu există cereri de schimb active.</p>';
      return;
    }

    container.innerHTML = exchanges.map(ex => `
      <div class="exchange-card">
        <div class="exchange-info">
          <strong>📖 Schimb #${ex.id}:</strong> 
          Oferă <em>${escapeHtml(ex.offered_book ? ex.offered_book.title : "Cartea #" + ex.offered_book_id)}</em> 
          pentru <em>${escapeHtml(ex.target_book ? ex.target_book.title : "Cartea #" + ex.target_book_id)}</em><br>
          <small>📞 Contact: ${escapeHtml(ex.contact_info)} ${ex.notes ? " | 💬 " + escapeHtml(ex.notes) : ""}</small>
        </div>
        <div>
          <span class="exchange-badge status-${ex.status}">${ex.status}</span>
        </div>
      </div>
    `).join("");
  } catch {
    container.innerHTML = '<p class="empty-text">Nu s-au putut încărca schimburile.</p>';
  }
}

function openExchangeModal(targetBookId, targetBookTitle) {
  const modal = document.getElementById("exchange-modal");
  const targetText = document.getElementById("modal-target-title");
  const targetHidden = document.getElementById("modal-target-id");
  const select = document.getElementById("modal-offered-select");

  targetText.textContent = "Cartea dorită: " + targetBookTitle;
  targetHidden.value = targetBookId;

  const eligibleBooks = allAvailableBooks.filter(b => b.id !== targetBookId);

  if (eligibleBooks.length === 0) {
    alert("Trebuie să existe cel puțin două cărți în catalog pentru a propune un schimb.");
    return;
  }

  select.innerHTML = eligibleBooks.map(b => `
    <option value="${b.id}">${escapeHtml(b.title)} (${escapeHtml(b.author)})</option>
  `).join("");

  modal.classList.remove("hidden");
}

function closeExchangeModal() {
  document.getElementById("exchange-modal").classList.add("hidden");
  document.getElementById("exchange-form").reset();
}

document.getElementById("modal-cancel-btn").addEventListener("click", closeExchangeModal);

document.getElementById("exchange-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("modal-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Se trimite...";

  const payload = {
    target_book_id: parseInt(document.getElementById("modal-target-id").value),
    offered_book_id: parseInt(document.getElementById("modal-offered-select").value),
    contact_info: document.getElementById("modal-contact").value.trim(),
    notes: document.getElementById("modal-notes").value.trim() || null
  };

  try {
    const res = await fetch("/api/exchanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok === false) {
      const err = await res.json();
      throw new Error(err.detail || "Eroare la crearea cererii.");
    }

    closeExchangeModal();
    await loadBooks();
    await loadExchanges();
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Trimite Cererea";
  }
});

function handleFilterInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadBooks, 250);
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, tag => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", """: "&quot;", "'": "&#39;"
  }[tag] || tag));
}

document.getElementById("search-input").addEventListener("input", handleFilterInput);
document.getElementById("filter-genre").addEventListener("input", handleFilterInput);
document.getElementById("filter-city").addEventListener("input", handleFilterInput);

document.getElementById("clear-filters-btn").addEventListener("click", () => {
  document.getElementById("search-input").value = "";
  document.getElementById("filter-genre").value = "";
  document.getElementById("filter-city").value = "";
  loadBooks();
});

document.getElementById("book-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.textContent = "Se salvează...";

  const payload = {
    title: document.getElementById("title").value,
    author: document.getElementById("author").value,
    genre: document.getElementById("genre").value || "General",
    condition: document.getElementById("condition").value,
    city: document.getElementById("city").value || "România"
  };

  try {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok === false) throw new Error("Eroare la salvare.");
    document.getElementById("book-form").reset();
    await loadBooks();
  } catch (err) {
    alert("Nu s-a putut adăuga cartea.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Adaugă în catalog";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadHealth();
  loadBooks();
  loadExchanges();
});
