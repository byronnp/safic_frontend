import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

// Pruebas unitarias de la lógica (cliente HTTP, sesión, guardas, menú, colores).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
  },
});
