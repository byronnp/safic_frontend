import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  anunciosService,
  type AlcanceAnuncio,
  type AnuncioAdmin,
  type DestinoAnuncio,
  type MisAvisos,
  type NuevoAnuncio,
} from '../services/anuncios.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesAnuncios = {
  todas: (condominioId: number | null) => ['comunicacion', condominioId] as const,
  admin: (condominioId: number | null) => ['comunicacion', condominioId, 'anuncios'] as const,
  alcance: (condominioId: number | null, d: DestinoAnuncio) =>
    ['comunicacion', condominioId, 'alcance', d.destino_tipo, d.bloque_id, d.unidades] as const,
  avisos: (condominioId: number | null) => ['comunicacion', condominioId, 'avisos'] as const,
};

export function useAnuncios() {
  const session = useSessionStore();

  return useQuery<AnuncioAdmin[], ApiError>({
    queryKey: computed(() => clavesAnuncios.admin(session.condominioId)),
    queryFn: () => anunciosService.listar(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
  });
}

/** `activo` es false mientras el destino esté incompleto (sin bloque o sin unidades): no se consulta. */
export function useAlcanceAnuncio(destino: Ref<DestinoAnuncio>, activo: Ref<boolean>) {
  const session = useSessionStore();

  return useQuery<AlcanceAnuncio, ApiError>({
    queryKey: computed(() => clavesAnuncios.alcance(session.condominioId, destino.value)),
    queryFn: () => anunciosService.alcance(destino.value),
    enabled: computed(() => session.condominioId !== null && activo.value),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useMisAvisos() {
  const session = useSessionStore();

  return useQuery<MisAvisos, ApiError>({
    queryKey: computed(() => clavesAnuncios.avisos(session.condominioId)),
    queryFn: () => anunciosService.mios(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
    // Trae enlaces temporales a los adjuntos: no se reusan de la caché
    gcTime: 0,
  });
}

/** Cada cambio mueve la lista de la administración y la del residente: se vuelve a pedir, también en error. */
function useMutacionAnuncios<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesAnuncios.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function usePublicarAnuncio() {
  return useMutacionAnuncios<void, NuevoAnuncio>((d) => anunciosService.publicar(d));
}

export function useReenviarAnuncio() {
  return useMutacionAnuncios<number, number>((id) => anunciosService.reenviar(id));
}

export function useLeerAviso() {
  return useMutacionAnuncios<void, number>((id) => anunciosService.leer(id));
}

export function useConfirmarAviso() {
  return useMutacionAnuncios<void, number>((id) => anunciosService.confirmar(id));
}
