import { createApp, type BaseContext } from "@daloyjs/core";
import { auth } from "./auth";
import { Portfolio, ServiceError, Weather, WeatherQuery } from "./schemas";

export const app = createApp({
  openapi: { info: { title: "Daloy + Better Auth Example API", version: "1.0.0" } },
  // auto-mounts GET /docs, /openapi.json, /openapi.yaml. Swagger UI is fully
  // self-contained (loaded from jsDelivr, which daloy's docs CSP allows) and
  // never phones home, so /docs renders cleanly under the strict default CSP.
  // (The default Scalar UI is nicer but its bundle fetches fonts/registry from
  // scalar.com, which the secure-by-default CSP correctly blocks.)
  docs: { ui: "swagger" },
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
  request: { query: WeatherQuery },
  responses: {
    200: { description: "Current weather", body: Weather },
    502: { description: "Upstream weather service unavailable", body: ServiceError },
  },
  handler: async (ctx) => {
    const lat = ctx.query.lat ?? 35.6595; // Shibuya Crossing, Tokyo
    const lon = ctx.query.lon ?? 139.7005;

    let wx: any = null;
    try {
      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weather_code,wind_speed_10m`,
      );
      wx = wxRes.ok ? await wxRes.json() : null;
    } catch {
      wx = null; // network error or non-JSON body
    }
    if (!wx?.current) {
      return { status: 502, body: { error: "Weather service unavailable" } };
    }

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
    200: { description: "Most active stocks for the logged-in user", body: Portfolio },
    401: { description: "Unauthorized", body: ServiceError },
    502: { description: "Upstream market-data service unavailable", body: ServiceError },
  },
  handler: async (ctx) => {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved" +
        "?scrIds=most_actives&count=5",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    const data = (res.ok ? await res.json() : null) as any;
    const quotes = data?.finance?.result?.[0]?.quotes ?? [];

    // Yahoo's keyless endpoint can return 401/429 (crumb required) — surface
    // that instead of a misleading empty table.
    if (!res.ok || quotes.length === 0) {
      return { status: 502, body: { error: "Market data unavailable" } };
    }

    const mostActive = quotes.slice(0, 5).map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName ?? q.symbol,
      price: Number((q.regularMarketPrice ?? 0).toFixed(2)),
      changePercent: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
    }));

    return { status: 200, body: { user: ctx.state.user.email, mostActive } };
  },
});
