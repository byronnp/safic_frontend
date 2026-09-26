import { defineBoot } from '#q-app';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

import type { ApiError } from '@/core/api/errors';

/**
 * Caché de datos del servidor. Las claves de consulta SIEMPRE incluyen el
 * condominio activo (ej. ['bloques', condominioId]) y la caché se vacía al
 * cambiar de condominio o cerrar sesión, para no mezclar datos.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (intentos, error) => {
        const estado = (error as Partial<ApiError>).estado ?? 0;
        // No reintentar errores del cliente (400-499): no cambiarán solos.
        return estado >= 400 && estado < 500 ? false : intentos < 2;
      },
    },
  },
});

export default defineBoot(({ app }) => {
  app.use(VueQueryPlugin, { queryClient });
});
