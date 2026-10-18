/**
 * Tipos de variables de entorno propias (import.meta.env).
 * https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference
 */
interface ImportMetaEnv {
  /** Solo para quasar.config.ts: backend al que se reenvía /api en desarrollo. */
  readonly API_PROXY_TARGET?: string;
  /** Solo para quasar.config.ts: 'true' para detectar cambios por sondeo (código en Windows). */
  readonly SAFIC_WATCH_POLLING?: string;
  /** Solo para quasar.config.ts: servidor Reverb al que se reenvía /app (WebSocket) en desarrollo. */
  readonly REVERB_PROXY_TARGET?: string;
  /** Solo para quasar.config.ts: clave pública de Reverb; llega al cliente como __REVERB_APP_KEY__. */
  readonly REVERB_APP_KEY?: string;
}

/** Clave pública de Reverb inyectada al compilar (quasar.config.ts); vacía = sin tiempo real. */
declare const __REVERB_APP_KEY__: string | undefined;
