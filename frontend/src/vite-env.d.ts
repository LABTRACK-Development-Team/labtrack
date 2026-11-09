/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SIGNALR_URL?: string;
  readonly VITE_SIGNALR_HUB_URL?: string;
  readonly VITE_AI_SERVICE_URL?: string;
  readonly VITE_DEFAULT_CAMPUS?: string;
  readonly VITE_HEARTBEAT_INTERVAL_MS?: string;
  readonly VITE_ENABLE_DEBUG_LOGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare const __LAN_IP__: string;
