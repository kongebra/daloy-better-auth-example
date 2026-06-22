import { defineConfig } from "@hey-api/openapi-ts";

// Genererer en fullt typet fetch-SDK fra daloy sin OpenAPI-spec (contract-first).
// Kjør `bun run gen` (krever ../api/openapi.json — lag den med `bun run gen` i apps/api).
export default defineConfig({
  input: "../api/openapi.json",
  output: "src/client",
  plugins: ["@hey-api/client-fetch"],
});
