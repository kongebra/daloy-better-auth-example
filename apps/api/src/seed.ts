import { getMigrations } from "better-auth/db/migration";
import { auth, authOptions } from "./auth";

// Bygg better-auth-tabellene i SQLite-fila (idempotent), så seed én testbruker.
// Eksempelet har bare innlogging — ingen signup i UI.
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "test1234";

const { runMigrations } = await getMigrations(authOptions);
await runMigrations();
console.log("✓ migrations applied");

try {
  await auth.api.signUpEmail({
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: "Test User" },
  });
  console.log(`✓ seeded user: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
} catch {
  console.log(`• user ${TEST_EMAIL} already exists — skipping`);
}
