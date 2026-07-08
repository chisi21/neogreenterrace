const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 5500;

const DATA_DIR = path.join(ROOT, "data");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");
const UPLOAD_DIR = path.join(ROOT, "assets", "articles", "uploads");

const TOKEN = "neogreen-admin-7f3a9c2e";
const ADMIN_USER = "admin";
const ADMIN_PASS = "neogreenterrace123";

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(ARTICLES_FILE)) fs.writeFileSync(ARTICLES_FILE, "[]");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function readArticles() {
  try { return JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8")); }
  catch (e) { return []; }
}
function writeArticles(list) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(list, null, 2));
}
function sendJSON(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}
function readBody(req, cb) {
  let data = "";
  let aborted = false;
  req.on("data", (c) => {
    data += c;
    if (data.length > 25 * 1024 * 1024) { aborted = true; req.destroy(); }
  });
  req.on("end", () => {
    if (aborted) return cb(new Error("too large"));
    try { cb(null, data ? JSON.parse(data) : {}); } catch (e) { cb(e); }
  });
}
function slugify(s) {
  return (s || "").toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "artikel";
}
function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}
function authed(req) {
  return (req.headers["authorization"] || "") === "Bearer " + TOKEN;
}

function handleApi(req, res) {
  const url = req.url.split("?")[0];

  if (req.method === "POST" && url === "/api/login") {
    return readBody(req, (err, b) => {
      if (err) return sendJSON(res, 400, { ok: false });
      if (b.username === ADMIN_USER && b.password === ADMIN_PASS)
        return sendJSON(res, 200, { ok: true, token: TOKEN });
      return sendJSON(res, 401, { ok: false, error: "Username atau password salah." });
    });
  }

  if (req.method === "GET" && url === "/api/articles") {
    const list = readArticles();
    const id = new URL(req.url, "http://x").searchParams.get("id");
    if (id) {
      const found = list.find((a) => a.id === id || a.slug === id);
      return found ? sendJSON(res, 200, found) : sendJSON(res, 404, { error: "not found" });
    }
    return sendJSON(res, 200, list);
  }

  if (req.method === "POST" && url === "/api/articles") {
    if (!authed(req)) return sendJSON(res, 401, { ok: false, error: "unauthorized" });
    return readBody(req, (err, b) => {
      if (err) return sendJSON(res, 400, { ok: false });
      const title = (b.title || "").trim();
      if (!title) return sendJSON(res, 400, { ok: false, error: "Judul wajib diisi." });
      const content = b.content || "";
      const list = readArticles();
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const article = {
        id,
        slug: slugify(title) + "-" + id.slice(-4),
        title,
        category: (b.category || "Uncategorized").trim() || "Uncategorized",
        cover: b.cover || "",
        content,
        excerpt: stripHtml(content).slice(0, 160),
        author: "Admin",
        date: new Date().toISOString(),
      };
      list.unshift(article);
      writeArticles(list);
      return sendJSON(res, 200, { ok: true, article });
    });
  }

  if (req.method === "POST" && url === "/api/upload") {
    if (!authed(req)) return sendJSON(res, 401, { ok: false });
    return readBody(req, (err, b) => {
      if (err || !b.dataUrl) return sendJSON(res, 400, { ok: false });
      const m = /^data:image\/([a-z0-9+]+);base64,(.+)$/i.exec(b.dataUrl);
      if (!m) return sendJSON(res, 400, { ok: false, error: "invalid image" });
      const ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
      const buf = Buffer.from(m[2], "base64");
      const name = "img-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + "." + ext;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      return sendJSON(res, 200, { ok: true, url: "assets/articles/uploads/" + name });
    });
  }

  return sendJSON(res, 404, { error: "unknown endpoint" });
}

function handleStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/admin-panel" || urlPath === "/admin-panel/") urlPath = "/admin-panel.html";
  if (urlPath === "/artikel" || urlPath === "/artikel/") urlPath = "/artikel.html";
  if (urlPath === "/kontak" || urlPath === "/kontak/") urlPath = "/kontak.html";

  const blocked = ["/server.js", "/package.json", "/package-lock.json", "/.gitignore"];
  if (blocked.indexOf(urlPath.toLowerCase()) !== -1 || urlPath.toLowerCase().indexOf("/.git") === 0) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1><p>" + urlPath + " tidak ditemukan</p>");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const range = req.headers.range;

    if (range) {
      const mm = /bytes=(\d*)-(\d*)/.exec(range);
      const start = mm[1] ? parseInt(mm[1], 10) : 0;
      const end = mm[2] ? parseInt(mm[2], 10) : stat.size - 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": type,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

http
  .createServer((req, res) => {
    if (req.url.startsWith("/api/")) return handleApi(req, res);
    return handleStatic(req, res);
  })
  .listen(PORT, () => {
    console.log(`NeoGreenTerrace dev server -> http://localhost:${PORT}`);
  });
