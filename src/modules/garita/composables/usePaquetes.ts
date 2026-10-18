import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, unref, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  paquetesService,
  type EntregaPaquete,
  type MisPaquetes,
  type NuevoPaquete,
  type PaquetesGarita,
} from '../services/paquetes.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesPaquetes = {
  todas: (condominioId: number | null) => ['paquetes', condominioId] as const,
  garita: (condominioId: number | null) => ['paquetes', condominioId, 'garita'] as const,
  mios: (condominioId: number | null) => ['paquetes', condominioId, 'mios'] as const,
};

export function usePaquetesGarita() {
  const session = useSessionStore();

  return useQuery<PaquetesGarita, ApiError>({
    queryKey: computed(() => clavesPaquetes.garita(session.condominioId)),
    queryFn: () => paquetesService.enGarita(),
    enabled: computed(() => session.condominioId !== null),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    // Trae enlaces temporales a las fotos: no se reusan de la caché
    gcTime: 0,
  });
}

export function useMisPaquetes(habilitado: Ref<boolean> | boolean = true) {
  const session = useSessionStore();

  return useQuery<MisPaquetes, ApiError>({
    queryKey: computed(() => clavesPaquetes.mios(session.condominioId)),
    queryFn: () => paquetesService.mios(),
    enabled: computed(() => session.condominioId !== null && unref(habilitado)),
    refetchOnWindowFocus: false,
    gcTime: 0,
  });
}

/** Cada cambio mueve la lista de la garita y la del residente: se vuelve a pedir, también en error. */
function useMutacionPaquetes<TVariables>(ejecutar: (variables: TVariables) => Promise<void>) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesPaquetes.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useRecibirPaquete() {
  return useMutacionPaquetes<NuevoPaquete>((d) => paquetesService.recibir(d));
}

export function useEntregarPaquete() {
  return useMutacionPaquetes<{ id: number; entrega: EntregaPaquete }>(({ id, entrega }) =>
    paquetesService.entregar(id, entrega),
  );
}
