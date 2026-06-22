import { createAuthClient } from "better-auth/react";

// Kaller /api/auth/* på samme origin (proxyet til daloy-backenden).
export const authClient = createAuthClient({
  baseURL: window.location.origin,
});
