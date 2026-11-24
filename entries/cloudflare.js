import { handle, buildUpstream, DEFAULT_UPSTREAM } from "../src/core.js";

export default {
  async fetch(request, env) {
    const opts = {
      upstream: env.UPSTREAM || DEFAULT_UPSTREAM,
      secret: env.PROXY_SECRET,
      clientIp: request.headers.get("cf-connecting-ip"),
    };
    if (request.headers.get("upgrade") === "websocket") {
      const { target, headers } = buildUpstream(request, opts);
      headers.set("upgrade", "websocket");
      return fetch(target, { headers });
    }
    return handle(request, opts);
  },
};
