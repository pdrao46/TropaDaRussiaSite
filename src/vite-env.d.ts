/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_INVITE_URL?: string;
  readonly VITE_ORDERS_API_URL?: string;
  readonly VITE_AUTH_ENABLED?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
