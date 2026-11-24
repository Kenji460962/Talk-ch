// Deno Deploy / `deno run -A entries/deno.js`
import { handle, DEFAULT_UPSTREAM } from "../src/core.js";

Deno.serve({ port: Number(Deno.env.get("PORT") || 8000) }, (req, info) =>
  handle(req, {
    upstream: Deno.env.get("UPSTREAM") || DEFAULT_UPSTREAM,
    secret: Deno.env.get("PROXY_SECRET"),
    clientIp: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || info.remoteAddr?.hostname,
  }));
