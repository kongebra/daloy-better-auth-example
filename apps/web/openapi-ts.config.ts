import { defineConfig } from "@hey-api/openapi-ts";

// Generates a fully typed fetch SDK from daloy's OpenAPI spec (contract-first).
// Run `bun run gen` (requires ../api/openapi.json — produce it with `bun run gen` in apps/api).
export default defineConfig({
  input: "../api/openapi.json",
  output: "src/client",
  plugins: ["@hey-api/client-fetch"],
});
