function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function safeCoverUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

const dict = {
  ro: {
    login: "Autentificare",
    register: "Cont nou",
    addBook: "+ Pune carte",
    trades: "Cereri",
    myShelf: "Raftul meu",
    city: "Oraș:",
    allCities: "Toate orașele",
    genre: "Gen:",
    allGenres: "Toate genurile",
    condition: "Stare:",
    allCond: "Oricare",
    format: "Format:",
    allFormats: "Toate",
    seriesOnly: "Pachet / Serie",
    singlesOnly: "Volum unic",
    reset: "Reset",
    catalogHeader: "Cărți disponibile pentru schimb",
    shelfTitle: "Cărțile de pe raftul utilizatorului:",
    tradesTitle: "Panou Cereri de Schimb",
    tabIn: "Primite",
    tabOut: "Trimise",
    propose: "Propune schimb",
    proposeHeader: "Propune un schimb",
    chooseBooks: "Bifează ce cărți oferi la schimb:",
    messageOpt: "Mesaj opțional:",
    cancel: "Renunță",
    sendTrade: "Trimite propunerea",
    contactHeader: "Date de contact",
    close: "Închide",
    pass: "Parolă",
    user: "Nume utilizator",
    contactLbl: "Telefon / Telegram",
    backToCatalog: "← Înapoi la catalog",
    booksLabel: "cărți găsite",
    noBooks: "Nu a fost găsită nicio carte.",
    accept: "Acceptă",
    reject: "Refuză",
    seeContact: "Vezi date contact"
  },
  en: {
    login: "Sign In",
    register: "Register",
    addBook: "+ Add Book",
    trades: "Trades",
    myShelf: "My Shelf",
    city: "City:",
    allCities: "All cities",
    genre: "Genre:",
    allGenres: "All genres",
    condition: "Condition:",
    allCond: "Any condition",
    format: "Format:",
    allFormats: "All formats",
    seriesOnly: "Bundle / Series",
    singlesOnly: "Single volume",
    reset: "Reset",
    catalogHeader: "Books available for trade",
    shelfTitle: "Books on reader's shelf:",
    tradesTitle: "Trade Requests Dashboard",
    tabIn: "Received",
    tabOut: "Sent",
    propose: "Propose Trade",
    proposeHeader: "Propose a Book Trade",
    chooseBooks: "Check which books you offer:",
    messageOpt: "Optional note:",
    cancel: "Cancel",
    sendTrade: "Submit Trade",
    contactHeader: "Contact Information",
    close: "Close",
    pass: "Password",
    user: "Username",
    contactLbl: "Phone / Telegram",
    backToCatalog: "← Back to catalog",
    booksLabel: "books found",
    noBooks: "No books match your criteria.",
    accept: "Accept",
    reject: "Decline",
    seeContact: "Show contact info"
  }
};

let currentLang = localStorage.getItem("site_lang") || "ro";
let user = JSON.parse(localStorage.getItem("site_user") || "null");
let token = localStorage.getItem("site_token") || null;
let currentBook = null;
let cachedBooks = [];
let tradeTab = "incoming";

document.addEventListener("DOMContentLoaded", function() {
  if (window.location.hash.startsWith("#verify-email=")) {
    const verificationToken = window.location.hash.slice("#verify-email=".length);
    history.replaceState(null, "", window.location.pathname);
    fetch("/api/auth/verify-email", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({token: verificationToken})
    }).then(r => alert(r.ok ? "Email confirmat. Te poți autentifica." : "Link invalid sau expirat."));
  }
  applyLang(currentLang);
  syncAuth();
  loadBooks();
  if (user) refreshBadge();
});

function toggleLanguage() {
  currentLang = currentLang === "ro" ? "en" : "ro";
  localStorage.setItem("site_lang", currentLang);
  applyLang(currentLang);
  renderGrid(cachedBooks, "booksGrid");
}

function applyLang(lang) {
  document.getElementById("langFlag").textContent = lang === "ro" ? "🇬🇧" : "🇷🇴";
  document.getElementById("langText").textContent = lang === "ro" ? "EN" : "RO";

  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    const k = el.getAttribute("data-i18n");
    if (dict[lang][k]) {
      el.textContent = dict[lang][k];
    }
  });

  document.getElementById("searchInput").placeholder = lang === "ro"
    ? "Caută după titlu sau autor..."
    : "Search by title or author...";
}

function syncAuth() {
  const g = document.getElementById("guestNav");
  const u = document.getElementById("userNav");
  if (user && token) {
    g.classList.add("hidden");
    u.classList.remove("hidden");
  } else {
    g.classList.remove("hidden");
    u.classList.add("hidden");
  }
}

function logout() {
  localStorage.removeItem("site_user");
  localStorage.removeItem("site_token");
  user = null;
  token = null;
  syncAuth();
  switchView("catalog");
}

function loadBooks() {
  fetch("/api/books")
    .then(r => r.json())
    .then(data => {
      cachedBooks = data;
      renderGrid(cachedBooks, "booksGrid");
    })
    .catch(err => console.error("Err:", err));
}

function handleSearch() {
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById("searchInput").value.trim();
  const city = document.getElementById("fCity").value;
  const genre = document.getElementById("fGenre").value;
  const cond = document.getElementById("fCond").value;
  const series = document.getElementById("fSeries").value;

  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (city !== "all") params.append("city", city);
  if (genre !== "all") params.append("genre", genre);
  if (cond !== "all") params.append("condition", cond);
  if (series === "series") params.append("series_only", "true");
  if (series === "single") params.append("series_only", "false");

  fetch("/api/books?" + params.toString())
    .then(r => r.json())
    .then(data => renderGrid(data, "booksGrid"));
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("fCity").value = "all";
  document.getElementById("fGenre").value = "all";
  document.getElementById("fCond").value = "all";
  document.getElementById("fSeries").value = "all";
  loadBooks();
}

function renderGrid(books, containerId) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = "";

  if (containerId === "booksGrid") {
    document.getElementById("countLabel").textContent = books.length + " " + dict[currentLang].booksLabel;
  }

  if (books.length === 0) {
    grid.innerHTML = '<div class="col-xs-12 text-center" style="padding: 30px; color: #777;">' + dict[currentLang].noBooks + '</div>';
    return;
  }

  books.forEach(function(original) {
    const b = { ...original, owner: { ...original.owner } };
    ["title", "author", "condition", "volume_info", "city", "genre"].forEach(k => b[k] = escapeHtml(b[k]));
    b.owner.username = escapeHtml(b.owner.username);
    b.cover_url = escapeHtml(safeCoverUrl(original.cover_url));
    const isMine = user && user.id === b.owner_id;
    const col = document.createElement("div");
    col.className = "col-md-3 col-sm-4 col-xs-6 book-item-col";

    const coverHtml = b.cover_url
      ? '<img src="' + b.cover_url + '" alt="' + b.title + '">'
      : '<div class="book-cover-fallback">Fără imagine</div>';

    const seriesTag = b.is_series
      ? '<span class="label label-warning">' + (b.volume_info || 'Serie') + '</span> '
      : '';

    col.innerHTML =
      '<div class="book-thumbnail-card">' +
        '<div class="book-user-header" onclick="event.stopPropagation(); loadProfile(' + b.owner.id + ')">👤 ' + b.owner.username + '</div>' +
        '<div class="book-cover-frame" onclick="showBook(' + b.id + ')">' + coverHtml + '</div>' +
        '<div style="margin-bottom: 5px;">' +
          '<span class="label label-info">' + b.condition + '</span> ' +
          seriesTag +
        '</div>' +
        '<div class="book-title-link" onclick="showBook(' + b.id + ')">' + b.title + '</div>' +
        '<div class="book-author-name">' + b.author + '</div>' +
        '<div class="book-meta-footer">📍 ' + b.city + ' • ' + b.genre + '</div>' +
        (!isMine
          ? '<button class="btn btn-default btn-xs btn-block" style="margin-top: 8px;" data-propose="true">' + dict[currentLang].propose + '</button>'
          : '') +
      '</div>';

    const proposeButton = col.querySelector("[data-propose]");
    if (proposeButton) proposeButton.addEventListener("click", event => {
      event.stopPropagation();
      startTrade(original.id, original.title);
    });
    grid.appendChild(col);
  });
}

function showBook(id) {
  fetch("/api/books/" + id)
    .then(r => r.json())
    .then(b => {
      currentBook = b;
      document.getElementById("mdTitle").textContent = b.title;
      document.getElementById("mdAuthor").textContent = b.author;
      document.getElementById("mdGenre").textContent = b.genre;
      document.getElementById("mdCond").textContent = b.condition;
      document.getElementById("mdFormat").textContent = b.is_series ? (b.volume_info || "Serie / Pachet") : "Volum unic";
      document.getElementById("mdCity").textContent = b.city;
      document.getElementById("mdDesc").textContent = b.description || "Nu există descriere disponibilă.";

      const img = document.getElementById("mdCover");
      img.src = safeCoverUrl(b.cover_url) || "https://placehold.co/140x200/eee/999?text=Fara+Coperta";

      const oLink = document.getElementById("mdOwnerLink");
      oLink.textContent = b.owner.username;
      oLink.onclick = function() {
        closeModal("bookModal");
        loadProfile(b.owner.id);
      };

      const btn = document.getElementById("mdProposeBtn");
      if (user && user.id === b.owner_id) {
        btn.style.display = "none";
      } else {
        btn.style.display = "inline-block";
      }

      openModal("bookModal");
    });
}

function triggerProposeFromModal() {
  if (!currentBook) return;
  closeModal("bookModal");
  startTrade(currentBook.id, currentBook.title);
}

function loadProfile(userId) {
  fetch("/api/users/" + userId + "/profile")
    .then(r => r.json())
    .then(p => {
      document.getElementById("profUser").textContent = p.username;
      document.getElementById("profLocation").textContent = "📍 " + (p.city || "România");
      document.getElementById("profBooks").textContent = p.books_count + " cărți pe raft";
      document.getElementById("profYear").textContent = "Membru din " + new Date(p.created_at).getFullYear();
      renderGrid(p.books, "profileGrid");
      switchView("profile");
    });
}

function openMyShelf() {
  if (user) loadProfile(user.id);
}

function startTrade(targetId, targetTitle) {
  if (!user) {
    openModal("loginModal");
    return;
  }
  currentBook = { id: targetId, title: targetTitle };
  document.getElementById("propTarget").innerHTML = "Cartea dorită: <strong>" + escapeHtml(targetTitle) + "</strong>";

  fetch("/api/books?owner_id=" + user.id + "&available_only=true")
    .then(r => r.json())
    .then(myList => {
      const box = document.getElementById("myBooksChecklist");
      box.innerHTML = "";
      if (myList.length === 0) {
        box.innerHTML = '<span class="text-danger" style="font-size:12px;">Nu ai cărți pe raftul tău!</span>';
      } else {
        myList.forEach(b => {
          const row = document.createElement("div");
          row.style.padding = "4px 0";
          row.innerHTML = '<label style="font-weight:normal; font-size:13px; margin:0;"><input type="checkbox" value="' + b.id + '"> ' + escapeHtml(b.title) + ' (' + escapeHtml(b.author) + ')</label>';
          box.appendChild(row);
        });
      }
      openModal("proposeModal");
    });
}

function submitTrade() {
  const checked = document.querySelectorAll("#myBooksChecklist input:checked");
  const ids = Array.from(checked).map(c => parseInt(c.value));
  const notes = document.getElementById("propNotes").value.trim();

  if (ids.length === 0) {
    alert("Selectează cel puțin o carte pe care o oferi!");
    return;
  }

  fetch("/api/exchanges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      target_book_id: currentBook.id,
      offered_book_ids: ids,
      notes: notes || null
    })
  }).then(r => {
    if (r.ok) {
      alert("Propunerea a fost trimisă!");
      closeModal("proposeModal");
      document.getElementById("propNotes").value = "";
    } else {
      r.json().then(e => alert(e.detail || "Eroare"));
    }
  });
}

function switchTradeTab(tab) {
  tradeTab = tab;
  document.getElementById("btnIn").className = tab === "incoming" ? "btn btn-primary btn-sm" : "btn btn-default btn-sm";
  document.getElementById("btnOut").className = tab === "outgoing" ? "btn btn-primary btn-sm" : "btn btn-default btn-sm";
  loadTrades();
}

function refreshBadge() {
  if (!token) return;
  fetch("/api/exchanges/incoming", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(r => r.ok ? r.json() : [])
  .then(list => {
    const p = list.filter(x => x.status === "pending").length;
    const b = document.getElementById("tradeBadge");
    if (p > 0) {
      b.textContent = p;
      b.classList.remove("hidden");
    } else {
      b.classList.add("hidden");
    }
  });
}

function loadTrades() {
  if (!token) return;
  const url = tradeTab === "incoming" ? "/api/exchanges/incoming" : "/api/exchanges/outgoing";
  fetch(url, { headers: { "Authorization": "Bearer " + token } })
    .then(r => r.json())
    .then(list => {
      const c = document.getElementById("requestsList");
      c.innerHTML = "";
      if (list.length === 0) {
        c.innerHTML = "<p class='text-muted' style='padding:15px;'>Nu există cereri în această secțiune.</p>";
        return;
      }
      list.forEach(item => {
        const tTitle = item.target_book ? item.target_book.title : "#" + item.target_book_id;
        const offTitles = item.offered_books && item.offered_books.length > 0
          ? item.offered_books.map(x => x.title).join(", ")
          : item.offered_book_ids.length + " cărți";

        const partner = tradeTab === "incoming" ? item.requester.username : (item.target_owner ? item.target_owner.username : "Utilizator");
        const div = document.createElement("div");
        div.className = "panel panel-default";
        div.innerHTML =
          '<div class="panel-heading" style="display:flex; justify-content:space-between;">' +
            '<strong>Partener: ' + escapeHtml(partner) + '</strong>' +
            '<span class="label label-primary">' + escapeHtml(item.status.toUpperCase()) + '</span>' +
          '</div>' +
          '<div class="panel-body">' +
            '<p><strong>Cartea cerută:</strong> ' + escapeHtml(tTitle) + '</p>' +
            '<p><strong>Cărți oferite la schimb:</strong> ' + escapeHtml(offTitles) + '</p>' +
            (item.notes ? '<p class="text-muted" style="font-style:italic;">"' + escapeHtml(item.notes) + '"</p>' : '') +
            '<div>' +
              (tradeTab === "incoming" && item.status === "pending"
                ? '<button class="btn btn-success btn-xs" onclick="respondTrade(' + item.id + ', \'accept\')">' + dict[currentLang].accept + '</button> ' +
                  '<button class="btn btn-danger btn-xs" onclick="respondTrade(' + item.id + ', \'reject\')">' + dict[currentLang].reject + '</button> '
                : '') +
              (item.status === "accepted"
                ? '<button class="btn btn-info btn-xs" onclick="showContact(' + item.id + ')">' + dict[currentLang].seeContact + '</button>'
                : '') +
            '</div>' +
          '</div>';
        c.appendChild(div);
      });
    });
}

function respondTrade(id, action) {
  fetch("/api/exchanges/" + id + "/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ action: action })
  }).then(r => {
    if (r.ok) {
      loadTrades();
      refreshBadge();
      loadBooks();
    } else {
      r.json().then(error => alert(error.detail || "Eroare"));
    }
  });
}

function showContact(id) {
  fetch("/api/exchanges/" + id + "/contact", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(r => r.json())
  .then(info => {
    document.getElementById("contactInfoArea").innerHTML =
      "<p><strong>Nume:</strong> " + escapeHtml(info.username) + "</p>" +
      "<p><strong>Oraș:</strong> " + escapeHtml(info.city) + "</p>" +
      "<p><strong>Email:</strong> " + escapeHtml(info.email) + "</p>" +
      "<p><strong>Contact:</strong> " + escapeHtml(info.contact_info) + "</p>";
    openModal("contactModal");
  });
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("loginMail").value;
  const password = document.getElementById("loginPwd").value;

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  })
  .then(r => r.json().then(data => ({ status: r.status, body: data })))
  .then(res => {
    if (res.status === 200) {
      token = res.body.access_token;
      user = res.body.user;
      localStorage.setItem("site_token", token);
      localStorage.setItem("site_user", JSON.stringify(user));
      syncAuth();
      closeModal("loginModal");
      refreshBadge();
      loadBooks();
    } else {
      alert(res.body.detail || "Eroare la autentificare");
    }
  });
}

function handleRegSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("regUName").value;
  const email = document.getElementById("regEmail").value;
  const contact_info = document.getElementById("regContact").value;
  const city = document.getElementById("regCity").value;
  const password = document.getElementById("regPwd").value;

  fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username,
      email: email,
      contact_info: contact_info,
      city: city,
      password: password
    })
  })
  .then(r => {
    if (r.ok) {
      alert("Cont creat! Te poți loga.");
      closeModal("registerModal");
      openModal("loginModal");
    } else {
      r.json().then(e => alert(e.detail || "Eroare"));
    }
  });
}

function handlePostBook(e) {
  e.preventDefault();
  const title = document.getElementById("addTitle").value;
  const author = document.getElementById("addAuthor").value;
  const genre = document.getElementById("addGenre").value;
  const condition = document.getElementById("addCond").value;
  const is_series = document.getElementById("addIsSeries").value === "true";
  const volume_info = document.getElementById("addVolInfo").value;
  const city = document.getElementById("addCity").value;
  const cover_url = document.getElementById("addCover").value || null;

  fetch("/api/books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      title: title,
      author: author,
      genre: genre,
      condition: condition,
      is_series: is_series,
      volume_info: volume_info,
      city: city,
      cover_url: cover_url
    })
  }).then(r => {
    if (r.ok) {
      alert("Cartea a fost adăugată!");
      closeModal("addBookModal");
      loadBooks();
    } else {
      r.json().then(e => alert(e.detail || "Eroare"));
    }
  });
}

function switchView(view) {
  document.querySelectorAll(".view-container").forEach(s => s.classList.remove("active"));
  if (view === "catalog") {
    document.getElementById("catalogView").classList.add("active");
    loadBooks();
  } else if (view === "profile") {
    document.getElementById("profileView").classList.add("active");
  } else if (view === "requests") {
    document.getElementById("requestsView").classList.add("active");
    loadTrades();
  }
}

function openModal(id) { document.getElementById(id).classList.add("active"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }
