(function () {
  "use strict";

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function esc(s) {
    return (s || "").toString().replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function getArticles() {
    return fetch("/data/articles.json?" + Date.now())
      .then(function (r) { return r.json(); })
      .catch(function () { return []; });
  }

  function cardHTML(a) {
    const media = a.cover
      ? '<div class="article-card__media"><span class="article-card__badge">' + esc(a.category) + "</span>" +
        '<img src="' + esc(a.cover) + '" alt="' + esc(a.title) + '" loading="lazy" /></div>'
      : '<div class="article-card__media article-card__media--empty"><span class="article-card__badge">' + esc(a.category) + "</span></div>";
    return (
      '<a class="article-card" href="artikel.html?id=' + esc(a.id) + '">' +
      media +
      '<div class="article-card__body">' +
      '<p class="article-card__meta">' + fmtDate(a.date) + ' &middot; By <strong>' + esc(a.author) + "</strong></p>" +
      '<h3 class="article-card__title">' + esc(a.title) + "</h3>" +
      '<p class="article-card__excerpt">' + esc(a.excerpt) + (a.excerpt && a.excerpt.length >= 160 ? "&hellip;" : "") + "</p>" +
      "</div></a>"
    );
  }

  const homeWrap = document.getElementById("articlesHome");
  const homeGrid = document.getElementById("homeArticles");
  if (homeGrid) {
    getArticles().then(function (list) {
      if (!list.length) { if (homeWrap) homeWrap.hidden = true; return; }
      homeGrid.innerHTML = list.slice(0, 3).map(cardHTML).join("");
      if (homeWrap) homeWrap.hidden = false;
    });
  }

  const app = document.getElementById("articleApp");
  if (app) {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const q = (params.get("q") || "").toLowerCase();
    const cat = params.get("cat") || "";
    const pageTitle = document.getElementById("pageTitle");
    const pageSub = document.getElementById("pageSub");

    getArticles().then(function (list) {
      if (id) return renderDetail(list, id);
      renderList(list);
    });

    function renderList(list) {
      let items = list;
      if (cat) items = items.filter(function (a) { return a.category === cat; });
      if (q) items = items.filter(function (a) {
        return (a.title + " " + a.excerpt + " " + a.category).toLowerCase().indexOf(q) > -1;
      });

      if (cat && pageTitle) { pageTitle.textContent = cat; pageSub.textContent = "Artikel dalam kategori " + cat + "."; }
      else if (q && pageSub) { pageSub.textContent = 'Hasil pencarian untuk "' + esc(q) + '".'; }

      if (!list.length) {
        app.innerHTML = '<div class="articles-empty"><h3>Belum ada artikel</h3><p>Artikel yang dipublikasikan akan muncul di sini.</p></div>';
        return;
      }
      if (!items.length) {
        app.innerHTML = '<div class="articles-empty"><h3>Tidak ada hasil</h3><p>Coba kata kunci atau kategori lain. <a href="artikel.html">Lihat semua artikel</a></p></div>';
        return;
      }
      app.innerHTML = '<div class="article-grid">' + items.map(cardHTML).join("") + "</div>";
    }

    function renderDetail(list, theId) {
      const a = list.find(function (x) { return x.id === theId || x.slug === theId; });
      if (!a) { app.innerHTML = '<div class="articles-empty"><h3>Artikel tidak ditemukan</h3><p><a href="artikel.html">Kembali ke daftar artikel</a></p></div>'; return; }
      if (pageTitle) pageTitle.textContent = a.category;
      if (pageSub) pageSub.textContent = "Dipublikasikan " + fmtDate(a.date) + " oleh " + a.author;
      document.title = a.title + " — Neo Green Terrace";

      const cover = a.cover ? '<figure class="article-single__cover"><img src="' + esc(a.cover) + '" alt="' + esc(a.title) + '" /></figure>' : "";

      const cats = {};
      list.forEach(function (x) { cats[x.category] = (cats[x.category] || 0) + 1; });
      const catList = Object.keys(cats).map(function (c) {
        return '<li><a href="artikel.html?cat=' + encodeURIComponent(c) + '">' + esc(c) + "</a></li>";
      }).join("");

      const recent = list.slice(0, 4).map(function (x) {
        const thumb = x.cover ? '<img src="' + esc(x.cover) + '" alt="" />' : '<span class="recent__thumb-empty"></span>';
        return '<li><a href="artikel.html?id=' + esc(x.id) + '">' + thumb +
          '<span><em>' + fmtDate(x.date) + ' &middot; By ' + esc(x.author) + "</em>" + esc(x.title) + "</span></a></li>";
      }).join("");

      app.innerHTML =
        '<div class="article-single">' +
          '<article class="article-single__main">' +
            '<p class="article-single__top"><span class="article-card__badge">' + esc(a.category) + "</span>" +
              '<span class="article-single__meta">' + fmtDate(a.date) + " &middot; By <strong>" + esc(a.author) + "</strong></span></p>" +
            '<h1 class="article-single__title">' + esc(a.title) + "</h1>" +
            cover +
            '<div class="article-content">' + a.content + "</div>" +
            '<a class="article-back" href="artikel.html">&larr; Kembali ke Artikel</a>' +
          "</article>" +
          '<aside class="article-sidebar">' +
            '<div class="sidebar-widget">' +
              "<h4>Search</h4>" +
              '<form class="sidebar-search" onsubmit="location.href=\'artikel.html?q=\'+encodeURIComponent(this.q.value);return false;">' +
                '<input type="search" name="q" placeholder="Search ..." />' +
                '<button type="submit" aria-label="Cari"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></button>' +
              "</form>" +
            "</div>" +
            '<div class="sidebar-widget"><h4>Categories</h4><ul class="sidebar-cats">' + catList + "</ul></div>" +
            '<div class="sidebar-widget"><h4>Recent Posts</h4><ul class="sidebar-recent">' + recent + "</ul></div>" +
          "</aside>" +
        "</div>";
    }
  }
})();
