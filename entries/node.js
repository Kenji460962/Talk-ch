// Render / Railway / Fly.io / Koyeb / VPS / Docker など Node 20+ が動く場所ならどこでも
import http from "node:http";
import { handle, DEFAULT_UPSTREAM } from "../src/core.js";

const upstream = process.env.UPSTREAM || DEFAULT_UPSTREAM;
const secret = process.env.PROXY_SECRET;
const first = (v) => (Array.isArray(v) ? v[0] : v)?.split(",")[0].trim();

http.createServer(async (req, res) => {
  try {
    const proto = first(req.headers["x-forwarded-proto"]) || "http";
    const host = first(req.headers["x-forwarded-host"]) || req.headers.host;
    const clientIp = first(req.headers["x-forwarded-for"]) || req.socket.remoteAddress;

    const chunks = [];
    for await (const c of req) chunks.push(c);
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const request = new Request(`${proto}://${host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: hasBody ? Buffer.concat(chunks) : undefined,
    });

    const r = await handle(request, { upstream, secret, clientIp });
    const headers = {};
    r.headers.forEach((v, k) => { if (k !== "set-cookie") headers[k] = v; });
    const sc = r.headers.getSetCookie?.() ?? [];
    if (sc.length) headers["set-cookie"] = sc;
    res.writeHead(r.status, headers);
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.writeHead(502).end("Bad gateway");
  }
}).listen(process.env.PORT || 8080);
