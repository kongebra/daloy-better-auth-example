import { app } from "./app";
import { auth } from "./auth";

// Sømmen: én web-standard fetch-dispatcher. better-auth eier /api/auth/*,
// daloy eier resten. Begge er fetch-native (auth.handler / app.fetch), så
// ingen adapter-lim trengs — de møtes på Request -> Response.
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
