import { createAuthClient } from "better-auth/react";

// Calls /api/auth/* on the same origin (proxied to the daloy backend).
export const authClient = createAuthClient({
  baseURL: window.location.origin,
});
