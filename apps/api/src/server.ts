import { app } from "./app";
import { auth } from "./auth";

// The seam: one web-standard fetch dispatcher. better-auth owns /api/auth/*,
// daloy owns the rest. Both are fetch-native (auth.handler / app.fetch), so no
// adapter glue is needed — they meet at Request -> Response.
const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/auth")) return auth.handler(req);
    return app.fetch(req);
  },
});

console.log(`API → http://localhost:${port}  (docs: /docs, auth: /api/auth/*)`);
