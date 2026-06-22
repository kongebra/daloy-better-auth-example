import { z } from "zod";

// Shared request/response models. daloy validates against these and emits them
// into the OpenAPI spec, which in turn types the generated frontend SDK.

export const WeatherQuery = z.object({
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional(),
});

export const Weather = z.object({
  place: z.string(),
  tempC: z.number(),
  condition: z.string(),
  windKmh: z.number(),
});

export const Stock = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
});

export const Portfolio = z.object({
  user: z.string(),
  mostActive: z.array(Stock),
});

export const ServiceError = z.object({ error: z.string() });
