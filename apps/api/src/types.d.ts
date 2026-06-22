// Typer ctx.state.user globalt (modul-augmentering av daloy sin AppState),
// satt av requireAuth-hooken i app.ts.
import "@daloyjs/core";

declare module "@daloyjs/core" {
  interface AppState {
    user: { id: string; email: string; name: string };
  }
}
