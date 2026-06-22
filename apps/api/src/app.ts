import { createApp, type BaseContext } from "@daloyjs/core";
import { z } from "zod";
import { auth } from "./auth";

export const app = createApp({
  openapi: { info: { title: "Daloy + Better Auth Example API", version: "1.0.0" } },
  docs: true, // auto-mounter GET /docs, /openapi.json, /openapi.yaml
});

// daloy-middleware (en beforeHandle-hook): verifiser better-auth-session og
// legg brukeren på ctx.state. Returnerer den en Response, kortsluttes ruta.
async function requireAuth(ctx: BaseContext<any, any>): Promise<Response | void> {
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  ctx.state.user = session.user;
}

// Public: hvem som helst kan hente (fake) værdata.
app.route({
  method: "GET",
  path: "/weather",
  operationId: "getWeather",
  tags: ["public"],
  summary: "Fake weather — no auth required",
  responses: {
    200: {
      description: "Current (fake) weather",
      body: z.object({ city: z.string(), tempC: z.number(), condition: z.string() }),
    },
  },
  handler: () => ({
    status: 200,
    body: { city: "Trondheim", tempC: 7, condition: "Cloudy" },
  }),
});

// Private: krever innlogget better-auth-session via requireAuth-hooken.
app.route({
  method: "GET",
  path: "/stock",
  operationId: "getStock",
  tags: ["private"],
  summary: "Fake stock portfolio — requires a session",
  hooks: { beforeHandle: requireAuth },
  responses: {
    200: {
      description: "(fake) stock portfolio for the logged-in user",
      body: z.object({
        user: z.string(),
        positions: z.array(
          z.object({ symbol: z.string(), shares: z.number(), price: z.number() }),
        ),
      }),
    },
    401: { description: "Unauthorized" },
  },
  handler: (ctx) => ({
    status: 200,
    body: {
      user: ctx.state.user.email,
      positions: [
        { symbol: "AAPL", shares: 10, price: 212.34 },
        { symbol: "EQNR.OL", shares: 50, price: 268.1 },
      ],
    },
  }),
});
