import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { cobroService, type CobroCuotas, type GuardarCobro } from '../services/cobro.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesCobro = {
  todos: (condominioId: number | null) => ['cobro', condominioId] as const,
};

export function useCobro() {
  const session = useSessionStore();

  return useQuery<CobroCuotas, ApiError>({
    queryKey: computed(() => clavesCobro.todos(session.condominioId)),
    queryFn: () => cobroService.ver(),
    enabled: computed(() => session.condominioId !== null),
    // Un refresco al volver a la pestaña no debe pisar lo que se está escribiendo
    refetchOnWindowFocus: false,
  });
}

export function useGuardarCobro() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<CobroCuotas, ApiError, GuardarCobro, { condominioId: number | null }>({
    mutationFn: (datos) => cobroService.guardar(datos),
    // El condominio de la petición, no el de cuando responde: si la persona cambió de condominio
    // mientras se guardaba, el cobro del anterior no debe quedar bajo la clave del nuevo.
    onMutate: () => ({ condominioId: session.condominioId }),
    onSuccess: (cobro, _datos, contexto) => {
      const condominioId = contexto?.condominioId ?? null;
      if (condominioId === null || condominioId !== session.condominioId) {
        return;
      }
      queryClient.setQueryData(clavesCobro.todos(condominioId), cobro);
      // El método de cobro también define qué montos pide el formulario de unidades
      void queryClient.invalidateQueries({ queryKey: ['unidades', condominioId] });
    },
  });
}
