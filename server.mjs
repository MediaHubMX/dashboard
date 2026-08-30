/**
 * Serves Glance on a domain of its own.
 *
 * The page itself still needs no server: it is one file, and opening it from
 * any static host works. This exists because a domain needs something
 * listening on it, and because the mirror system wants `/mhub-site.json` next
 * to the page, which a bare file cannot answer.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3003);

// Read once: it is one file and it does not change under a running process.
const page = await readFile(join(here, "index.html"));

// Every domain this same page answers on. The mirror system is what lets the
// page survive one of them going away, and only whoever set the domains up
// knows what the others are, so it is deployment knowledge and lives in the
// environment. Unset means the one domain the request came in on.
const endpoints = process.env.MHUB_SITE_ENDPOINTS
  ? process.env.MHUB_SITE_ENDPOINTS.split(",").map((e) => e.trim()).filter(Boolean)
  : null;

function send(res, status, body, type, extra = {}) {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*", ...extra });
  res.end(body);
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url, "http://glance.local").pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    return res.end();
  }

  switch (pathname) {
    case "/":
    case "/index.html":
      return send(res, 200, page, "text/html; charset=utf-8", { "Cache-Control": "public, max-age=300" });

    case "/mhub-site.json": {
      const origin = `https://${req.headers.host}`;
      return send(res, 200, JSON.stringify({
        id: "glance",
        endpoints: endpoints || [origin],
      }), "application/json; charset=utf-8", { "Cache-Control": "public, max-age=300" });
    }

    // Up, with a page to serve. Public, so it says yes and nothing else, and
    // named after no protocol, because none asks for it. Nothing here reaches
    // out to anything either: every tile fetches its own data from the
    // browser, so this process being healthy says nothing about whether the
    // weather is up and must not claim to.
    //
    // There is no "no" to answer: the page is read at startup, and a process
    // that could not read it never got as far as listening. A monitor finding
    // nothing on the port is the failure here, which is the one it is best at
    // spotting anyway.
    case "/health.json":
      return send(res, 200, JSON.stringify({ ok: true }),
        "application/json; charset=utf-8", { "Cache-Control": "no-store" });

    default:
      return send(res, 404, JSON.stringify({ error: "not_found" }), "application/json; charset=utf-8");
  }
});

server.listen(port, () => {
  console.log(`mhub glance on :${port}`);
});
