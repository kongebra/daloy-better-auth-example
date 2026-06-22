import { client } from "./client/client.gen";

// SDK-en peker default på http://localhost:3000 (fra OpenAPI servers). Vi vil
// heller gå via Vite-proxyen (samme origin) så cookien sendes med — så vi
// nuller baseUrl til relativ og inkluderer credentials.
client.setConfig({ baseUrl: "", credentials: "include" });

export { getWeather, getStock } from "./client";
export type { GetWeatherResponse, GetStockResponse } from "./client";
