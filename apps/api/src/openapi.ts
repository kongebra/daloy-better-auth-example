import { generateOpenAPI } from "@daloyjs/core/openapi";
import { app } from "./app";

// Skriver OpenAPI 3.1-spec til stdout. `bun run gen` lagrer den til openapi.json,
// som frontend bruker til å generere en typet SDK (Hey API).
const doc = generateOpenAPI(app, {
  info: { title: "Daloy + Better Auth Example API", version: "1.0.0" },
  servers: [{ url: "http://localhost:3000" }],
});

console.log(JSON.stringify(doc, null, 2));
