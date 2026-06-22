import { betterAuth, type BetterAuthOptions } from "better-auth";
import { Database } from "bun:sqlite";

// Users are stored in a single local SQLite file (bun:sqlite, native to Bun).
// It is only hit on signup/login — protected API calls verify against the
// signed cookie (session.cookieCache) without a DB lookup.
export const authOptions = {
  database: new Database(process.env.AUTH_DB ?? "auth.sqlite"),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me-0123456789",
  // The Vite dev server (5173) sends Origin; the backend runs on 3000.
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // no email sending in this example
  },
  session: {
    // Stateless: the session lives in a signed/encrypted cookie, so getSession
    // doesn't query the database on every protected call.
    cookieCache: { enabled: true, maxAge: 7 * 24 * 60 * 60 },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);
