import { getMigrations } from "better-auth/db/migration";
import { auth, authOptions } from "./auth";

// Build the better-auth tables in the SQLite file (idempotent), then seed one
// test user. The example only has sign-in — no signup in the UI.
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
