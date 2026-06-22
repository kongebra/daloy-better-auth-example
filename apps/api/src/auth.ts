import { betterAuth, type BetterAuthOptions } from "better-auth";
import { Database } from "bun:sqlite";

// Brukere lagres i én lokal SQLite-fil (bun:sqlite, native i Bun). Den treffes
// bare ved signup/login — beskyttede API-kall verifiseres mot signert cookie
// (session.cookieCache) uten DB-oppslag.
export const authOptions = {
  database: new Database(process.env.AUTH_DB ?? "auth.sqlite"),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me-0123456789",
  // Vite dev-server (5173) sender Origin; backend kjører på 3000.
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // ingen e-postutsending i dette eksempelet
  },
  session: {
    // Stateless: session ligger i en signert/kryptert cookie, så getSession
    // slipper å spørre databasen på hvert beskyttede kall.
    cookieCache: { enabled: true, maxAge: 7 * 24 * 60 * 60 },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);
