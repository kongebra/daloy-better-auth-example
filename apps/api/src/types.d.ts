// Types ctx.state.user globally (module augmentation of daloy's AppState),
// set by the requireAuth hook in app.ts.
import "@daloyjs/core";

declare module "@daloyjs/core" {
  interface AppState {
    user: { id: string; email: string; name: string };
  }
}
