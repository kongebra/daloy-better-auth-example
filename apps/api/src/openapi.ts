import { generateOpenAPI } from "@daloyjs/core/openapi";
import { app } from "./app";

// Writes the OpenAPI 3.1 spec to stdout. `bun run gen` saves it to openapi.json,
// which the frontend uses to generate a typed SDK (Hey API).
const doc = generateOpenAPI(app, {
  info: { title: "Daloy + Better Auth Example API", version: "1.0.0" },
  servers: [{ url: "http://localhost:3000" }],
});

console.log(JSON.stringify(doc, null, 2));
