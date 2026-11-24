import { handle, DEFAULT_UPSTREAM } from "../../src/core.js";

export default (request, context) =>
  handle(request, {
    upstream: Netlify.env.get("UPSTREAM") || DEFAULT_UPSTREAM,
    secret: Netlify.env.get("PROXY_SECRET"),
    clientIp: context.ip,
  });

export const config = { path: "/*" };
