# daloy + better-auth example

A minimal full-stack example wiring [**daloy**](https://github.com/daloyjs/daloy)
(a contract-first, runtime-portable TypeScript web framework) together with
[**better-auth**](https://www.better-auth.com) for email/password login.

It demonstrates the part that isn't obvious: **how the two libraries share one
HTTP server and one session cookie**, with a public endpoint anyone can read and
a private endpoint guarded by a daloy middleware that checks the better-auth
session.

## What it shows

- A single Bun server hosting **both** better-auth (`/api/auth/*`) and a daloy API.
- `GET /weather` — **public** real weather from [Open-Meteo](https://open-meteo.com)
  for the user's location (the browser sends lat/lon; falls back to Shibuya, Tokyo).
- `GET /stock` — **private** top-5 most active stocks from Yahoo Finance, gated by
  a daloy `beforeHandle` hook that calls `auth.api.getSession(...)`.
- Stateless sessions (better-auth `cookieCache`) — protected calls verify a
  signed cookie **without** hitting the database.
- A typed frontend SDK **generated from daloy's OpenAPI contract** (Hey API).
- A Vite + React UI: weather always visible, stocks visible only when logged in.
- All data comes from **keyless** public APIs — no sign-ups, no secrets.

## The integration seam

daloy is contract-first and has no catch-all route, while better-auth needs a
`/api/auth/*` catch-all. Both expose a web-standard `(Request) => Response`
handler, so they meet at one tiny dispatcher — no adapter glue, no extra
framework:

```ts
// apps/api/src/server.ts
Bun.serve({
  port: 3000,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/auth")) return auth.handler(req); // better-auth
    return app.fetch(req);                                          // daloy
  },
});
```

The private endpoint is guarded by a daloy lifecycle hook:

```ts
// apps/api/src/app.ts
async function requireAuth(ctx) {
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  ctx.state.user = session.user;
}

app.route({ method: "GET", path: "/stock", hooks: { beforeHandle: requireAuth }, /* ... */ });
```

## Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| API framework | daloy (`@daloyjs/core`) |
| Auth | better-auth (email/password, stateless sessions) |
| User store | SQLite via `bun:sqlite` (one file, no Docker) |
| Frontend | Vite + React |
| Frontend ↔ API | typed SDK generated from daloy's OpenAPI (Hey API) |
| Dev networking | Vite proxy → same origin → cookie just works |

## Quick start

Requires [Bun](https://bun.sh).

```bash
bun install
bun run setup   # generate OpenAPI + typed SDK, run migrations, seed test user
bun run dev     # starts API (:3000) and web (:5173) together
```

Open http://localhost:5173 and log in with the seeded user:

```
test@example.com / test1234
```

API docs (OpenAPI UI) are served at http://localhost:3000/docs.

## Project layout

```
apps/
  api/   daloy + better-auth backend
    src/auth.ts      better-auth config (bun:sqlite, stateless sessions)
    src/app.ts       daloy app: /weather (public) + /stock (private)
    src/schemas.ts   shared Zod models for requests/responses
    src/server.ts    Bun.serve dispatcher (the seam)
    src/seed.ts      migrations + seed the test user
    src/openapi.ts   emit OpenAPI 3.1 spec for SDK generation
    src/types.d.ts   types ctx.state.user (augments daloy's AppState)
  web/   Vite + React frontend
    src/auth-client.ts  better-auth React client
    src/api.ts          configures the generated SDK client
    src/App.tsx         the UI
```

## How auth flows

1. The browser hits `:5173/api/auth/sign-in/email`; Vite proxies it to the Bun
   server, which routes `/api/auth/*` to better-auth.
2. better-auth verifies the credential against the SQLite user table and sets a
   signed session cookie.
3. The React app calls `/stock` through the generated SDK (same origin via the
   proxy, so the cookie rides along).
4. daloy's `requireAuth` hook calls `auth.api.getSession(...)`, which reads the
   signed cookie (no DB query thanks to `cookieCache`) and either populates
   `ctx.state.user` or short-circuits with `401`.
