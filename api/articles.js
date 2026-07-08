const articles = require("../data/articles.json");

module.exports = function (req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (id) {
      const found = articles.find(function (a) { return a.id === id || a.slug === id; });
      res.statusCode = found ? 200 : 404;
      return res.end(JSON.stringify(found || { error: "not found" }));
    }
  } catch (e) {}
  res.statusCode = 200;
  res.end(JSON.stringify(articles));
};
