import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  condominioService,
  type ActualizarDatosCondominio,
  type DatosCondominio,
  type VarianteLogo,
} from '../services/condominio.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesDatosCondominio = {
  todos: (condominioId: number | null) => ['condominio', condominioId] as const,
};

export function useDatosCondominio() {
  const session = useSessionStore();

  return useQuery<DatosCondominio, ApiError>({
    queryKey: computed(() => clavesDatosCondominio.todos(session.condominioId)),
    queryFn: () => condominioService.ver(),
    enabled: computed(() => session.condominioId !== null),
    // Un refresco al volver a la pestaña no debe pisar lo que se está escribiendo
    refetchOnWindowFocus: false,
  });
}

/**
 * Mutaciones sobre los datos del propio condominio. Al terminar, la caché y la sesión
 * (menú, tema y logos) reflejan lo guardado. Se usa el condominio de cuando se envió:
 * si la persona cambia de condominio mientras tanto, no se mezclan.
 */
function useMutacionDatos<TVariables>(
  ejecutar: (variables: TVariables) => Promise<DatosCondominio>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<DatosCondominio, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSuccess: (datos, _variables, contexto) => {
      const condominioId = contexto?.condominioId ?? null;
      if (condominioId === null || condominioId !== session.condominioId) {
        return;
      }
      queryClient.setQueryData(clavesDatosCondominio.todos(condominioId), datos);
      session.aplicarDatosCondominio(condominioId, { nombre: datos.nombre, marca: datos.marca });
    },
  });
}

export function useActualizarDatosCondominio() {
  return useMutacionDatos<ActualizarDatosCondominio>((datos) =>
    condominioService.actualizar(datos),
  );
}

export function useSubirLogo() {
  return useMutacionDatos<{ variante: VarianteLogo; archivo: File }>(({ variante, archivo }) =>
    condominioService.subirLogo(variante, archivo),
  );
}

export function useQuitarLogo() {
  return useMutacionDatos<VarianteLogo>((variante) => condominioService.quitarLogo(variante));
}
