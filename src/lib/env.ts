/** Client-only mocked feed (no /api / SSE). Static hosts (e.g. Vercel) have no bundled API unless you deploy one. */
const explicitOffline =
  import.meta.env.VITE_OFFLINE_FEED === "true" ||
  import.meta.env.VITE_OFFLINE_FEED === "1";
const explicitOnline = import.meta.env.VITE_OFFLINE_FEED === "false";

export const isOfflineFeed =
  explicitOffline || (import.meta.env.PROD && !explicitOnline);
