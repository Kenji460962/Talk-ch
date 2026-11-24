// 共通コア: Web標準の Request/Response だけで書いてあるので、
// Cloudflare Workers / Deno / Netlify Edge / Node 20+ のどれでも動く。
export const DEFAULT_UPSTREAM = "https://talk-ch.com";

const STRIP_EXACT = ["connection", "keep-alive", "transfer-encoding", "upgrade", "te",
  "trailer", "proxy-authorization", "proxy-authenticate", "host", "accept-encoding",
  "content-length", "forwarded", "x-real-ip"];
const STRIP_PREFIX = ["cf-", "x-forwarded-", "x-vercel-", "x-nf-", "x-render-", "x-railway-", "x-amzn-"];

// 転送先URLと転送ヘッダを作る（転送先は常に upstream に固定 = オープンプロキシにならない）
export function buildUpstream(request, { upstream, secret, clientIp }) {
  const up = new URL(upstream || DEFAULT_UPSTREAM);
  const self = new URL(request.url);
  const target = new URL(self.pathname + self.search, up);

  const h = new Headers(request.headers);
  for (const k of [...h.keys()]) {
    if (STRIP_EXACT.includes(k) || STRIP_PREFIX.some((p) => k.startsWith(p))) h.delete(k);
  }
  h.set("accept-encoding", "identity"); // 圧縮の扱いをプラットフォーム間で揃える
  if (clientIp) h.set("x-forwarded-for", clientIp);
  h.set("x-forwarded-host", self.host);
  h.set("x-forwarded-proto", self.protocol.replace(":", ""));
  if (secret) h.set("x-proxy-secret", secret);
  if (h.has("origin")) h.set("origin", up.origin);
  if (h.has("referer")) h.set("referer", h.get("referer").split(self.origin).join(up.origin));
  return { target, headers: h, up, self };
}

export async function handle(request, opts) {
  const { target, headers, up, self } = buildUpstream(request, opts);
  const hasBody = !["GET", "HEAD"].includes(request.method);

  let res;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch (e) {
    return new Response("Bad gateway", { status: 502 });
  }

  const out = new Headers(res.headers);
  const loc = out.get("location");
  if (loc) out.set("location", loc.split(up.origin).join(self.origin));

  out.delete("set-cookie");
  for (const c of res.headers.getSetCookie?.() ?? []) {
    out.append("set-cookie", c.replace(/;\s*Domain=[^;]+/i, ""));
  }
  out.delete("content-security-policy");
  out.delete("strict-transport-security");
  out.delete("content-length");
  out.delete("content-encoding");

  const type = out.get("content-type") || "";
  const noBody = [101, 204, 205, 304].includes(res.status) || request.method === "HEAD";
  if (!noBody && /text\/html|text\/css|javascript|json|xml/.test(type)) {
    const text = (await res.text()).split(up.origin).join(self.origin);
    return new Response(text, { status: res.status, headers: out });
  }
  return new Response(noBody ? null : res.body, { status: res.status, headers: out });
}
