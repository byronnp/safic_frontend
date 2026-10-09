import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onBeforeUnmount, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { terminoValido } from '../directorio.logica';
import { directorioService, type DirectorioUnidad } from '../services/directorio.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesDirectorio = {
  busqueda: (condominioId: number | null, termino: string) =>
    ['garita', 'directorio', condominioId, termino] as const,
};

/** Consulta el directorio; no hace nada hasta que el término tenga 2 letras o números. */
export function useDirectorio(termino: Ref<string>) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  // Al salir de la pantalla no queda ningún teléfono en la caché
  onBeforeUnmount(() => queryClient.removeQueries({ queryKey: ['garita', 'directorio'] }));

  return useQuery<DirectorioUnidad[], ApiError>({
    queryKey: computed(() => clavesDirectorio.busqueda(session.condominioId, termino.value.trim())),
    queryFn: () => directorioService.buscar(termino.value),
    enabled: computed(() => session.condominioId !== null && terminoValido(termino.value)),
    // Teléfonos sin enmascarar: se vuelven a pedir pronto y no se retienen en memoria
    // (en una garita compartida no deben sobrevivir a la búsqueda). Sin placeholderData:
    // mientras carga no se muestran los resultados de la búsqueda anterior.
    staleTime: 10_000,
    gcTime: 10_000,
  });
}
