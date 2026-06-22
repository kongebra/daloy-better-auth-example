import { createApp, type BaseContext } from "@daloyjs/core";
import { z } from "zod";
import { auth } from "./auth";

export const app = createApp({
  openapi: { info: { title: "Daloy + Better Auth Example API", version: "1.0.0" } },
  docs: true, // auto-mounts GET /docs, /openapi.json, /openapi.yaml
});

// daloy middleware (a beforeHandle hook): verify the better-auth session and
// put the user on ctx.state. Returning a Response short-circuits the route.
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

// WMO weather code -> text (https://open-meteo.com/en/docs)
const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Rain", 65: "Heavy rain", 71: "Slight snow", 73: "Snow",
  75: "Heavy snow", 77: "Snow grains", 80: "Rain showers", 81: "Rain showers",
  82: "Violent rain showers", 85: "Snow showers", 86: "Snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ hail",
};

// Public: real weather from Open-Meteo (keyless). The frontend sends lat/lon
// when geolocation is available — otherwise we fall back to Shibuya, Tokyo.
app.route({
  method: "GET",
  path: "/weather",
  operationId: "getWeather",
  tags: ["public"],
  summary: "Real weather for given coordinates (defaults to Shibuya, Tokyo)",
  request: {
    query: z.object({
      lat: z.coerce.number().optional(),
      lon: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Current weather",
      body: z.object({
        place: z.string(),
        tempC: z.number(),
        condition: z.string(),
        windKmh: z.number(),
      }),
    },
  },
  handler: async (ctx) => {
    const lat = ctx.query.lat ?? 35.6595; // Shibuya Crossing, Tokyo
    const lon = ctx.query.lon ?? 139.7005;

    const wx = (await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code,wind_speed_10m`,
    ).then((r) => r.json())) as any;

    // Place name is best-effort (BigDataCloud reverse-geocode, keyless, English).
    // If it fails we show the coordinates instead.
    let place = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    try {
      const geo = (await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client` +
          `?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      ).then((r) => r.json())) as any;
      const name = geo.locality || geo.city;
      const region = geo.city && geo.city !== name ? geo.city : geo.principalSubdivision;
      if (name) place = region && region !== name ? `${name}, ${region}` : name;
    } catch {
      // keep coordinate fallback
    }

    return {
      status: 200,
      body: {
        place,
        tempC: wx.current.temperature_2m,
        condition: WMO[wx.current.weather_code] ?? `WMO ${wx.current.weather_code}`,
        windKmh: wx.current.wind_speed_10m,
      },
    };
  },
});

// Private: real "top 5 most active" from Yahoo Finance (keyless), gated by the
// requireAuth hook.
app.route({
  method: "GET",
  path: "/stock",
  operationId: "getStock",
  tags: ["private"],
  summary: "Top 5 most active stocks (Yahoo Finance) — requires a session",
  hooks: { beforeHandle: requireAuth },
  responses: {
    200: {
      description: "Most active stocks for the logged-in user",
      body: z.object({
        user: z.string(),
        mostActive: z.array(
          z.object({
            symbol: z.string(),
            name: z.string(),
            price: z.number(),
            changePercent: z.number(),
          }),
        ),
      }),
    },
    401: { description: "Unauthorized" },
  },
  handler: async (ctx) => {
    const res = (await fetch(
      "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved" +
        "?scrIds=most_actives&count=5",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.json())) as any;

    const quotes = res.finance?.result?.[0]?.quotes ?? [];
    const mostActive = quotes.slice(0, 5).map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName ?? q.symbol,
      price: q.regularMarketPrice ?? 0,
      changePercent: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
    }));

    return { status: 200, body: { user: ctx.state.user.email, mostActive } };
  },
});
