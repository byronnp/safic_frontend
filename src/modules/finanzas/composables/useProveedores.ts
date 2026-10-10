import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  proveedoresService,
  type ActualizarProveedor,
  type FiltroProveedores,
  type ListaProveedores,
  type NuevaCuentaProveedor,
  type NuevoProveedor,
  type Proveedor,
} from '../services/proveedores.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesProveedores = {
  lista: (condominioId: number | null, filtro: FiltroProveedores, buscar: string) =>
    ['finanzas', condominioId, 'proveedores', filtro, buscar.trim()] as const,
};

export function useProveedores(filtro: Ref<FiltroProveedores>, buscar: Ref<string>) {
  const session = useSessionStore();

  return useQuery<ListaProveedores, ApiError>({
    queryKey: computed(() =>
      clavesProveedores.lista(session.condominioId, filtro.value, buscar.value),
    ),
    queryFn: () => proveedoresService.listar(filtro.value, buscar.value),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
    // Los números de cuenta son sensibles: no se guardan en memoria al salir de la pantalla
    gcTime: 0,
    placeholderData: (anterior) => anterior,
  });
}

/**
 * Toda mutación se vuelve a pedir desde el condominio donde se envió (no el de cuando responde),
 * también en error: el cambio pudo guardarse aunque la respuesta falle.
 */
function useMutacionProveedores<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    // Las variables (contraseña, número de cuenta) y la respuesta no se guardan tras terminar
    gcTime: 0,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesFinanzas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useCrearProveedor() {
  return useMutacionProveedores<Proveedor, NuevoProveedor>((d) => proveedoresService.crear(d));
}

export function useActualizarProveedor() {
  return useMutacionProveedores<Proveedor, { id: number; datos: ActualizarProveedor }>(
    ({ id, datos }) => proveedoresService.actualizar(id, datos),
  );
}

export function useCambiarCuentaProveedor() {
  return useMutacionProveedores<Proveedor, { id: number; datos: NuevaCuentaProveedor }>(
    ({ id, datos }) => proveedoresService.cambiarCuenta(id, datos),
  );
}

export function useDetenerCambioCuenta() {
  return useMutacionProveedores<Proveedor, number>((id) => proveedoresService.detenerCambio(id));
}
