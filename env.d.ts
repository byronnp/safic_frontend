/**
 * Tipos de variables de entorno propias (import.meta.env).
 * https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference
 */
interface ImportMetaEnv {
  /** Solo para quasar.config.ts: backend al que se reenvía /api en desarrollo. */
  readonly API_PROXY_TARGET?: string;
  /** Solo para quasar.config.ts: 'true' para detectar cambios por sondeo (código en Windows). */
  readonly SAFIC_WATCH_POLLING?: string;
}
