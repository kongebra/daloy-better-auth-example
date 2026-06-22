import { client } from "./client/client.gen";

// The SDK defaults to http://localhost:3000 (from the OpenAPI servers). We'd
// rather go through the Vite proxy (same origin) so the cookie is sent — so we
// reset baseUrl to relative and include credentials.
client.setConfig({ baseUrl: "", credentials: "include" });

export { getWeather, getStock } from "./client";
export type { GetWeatherResponse, GetStockResponse } from "./client";
