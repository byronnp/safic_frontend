import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  unidadesService,
  type AsignarOcupante,
  type FiltroUnidades,
  type GuardarMascota,
  type GuardarUnidad,
  type GuardarVehiculo,
  type Mascota,
  type Ocupante,
  type PaginaUnidades,
  type ResumenUnidades,
  type Unidad,
  type UnidadDetalle,
  type Vehiculo,
} from '../services/unidades.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesUnidades = {
  todas: (condominioId: number | null) => ['unidades', condominioId] as const,
  lista: (condominioId: number | null, filtro: FiltroUnidades) =>
    ['unidades', condominioId, 'lista', filtro] as const,
  resumen: (condominioId: number | null) => ['unidades', condominioId, 'resumen'] as const,
  detalle: (condominioId: number | null, id: number) =>
    ['unidades', condominioId, 'detalle', id] as const,
  historial: (condominioId: number | null, id: number) =>
    ['unidades', condominioId, 'historial', id] as const,
};

export function useUnidades(filtro: Ref<FiltroUnidades>) {
  const session = useSessionStore();

  return useQuery<PaginaUnidades, ApiError>({
    queryKey: computed(() => clavesUnidades.lista(session.condominioId, { ...filtro.value })),
    queryFn: () => unidadesService.listar(filtro.value),
    enabled: computed(() => session.condominioId !== null),
    placeholderData: (anterior) => anterior,
  });
}

export function useResumenUnidades() {
  const session = useSessionStore();

  return useQuery<ResumenUnidades, ApiError>({
    queryKey: computed(() => clavesUnidades.resumen(session.condominioId)),
    queryFn: () => unidadesService.resumen(),
    enabled: computed(() => session.condominioId !== null),
  });
}

export function useCrearUnidad() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<Unidad, ApiError, GuardarUnidad>({
    mutationFn: (datos) => unidadesService.crear(datos),
    // Lista y resumen (cupo, suma de alícuotas) cambian con cada alta
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clavesUnidades.todas(session.condominioId) }),
  });
}

export function useUnidad(id: Ref<number>) {
  const session = useSessionStore();

  return useQuery<UnidadDetalle, ApiError>({
    queryKey: computed(() => clavesUnidades.detalle(session.condominioId, id.value)),
    queryFn: () => unidadesService.ver(id.value),
    enabled: computed(() => session.condominioId !== null && id.value > 0),
    retry: (intentos, error) => error.estado !== 404 && intentos < 2,
  });
}

export function useHistorialOcupantes(id: Ref<number>, activo: Ref<boolean>) {
  const session = useSessionStore();

  return useQuery<Ocupante[], ApiError>({
    queryKey: computed(() => clavesUnidades.historial(session.condominioId, id.value)),
    queryFn: () => unidadesService.historialOcupantes(id.value),
    enabled: computed(() => session.condominioId !== null && id.value > 0 && activo.value),
  });
}

/** Asignar o finalizar cambia el detalle, la lista (estado, propietario) y el resumen. */
export function useInvalidarUnidades() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: clavesUnidades.todas(session.condominioId) });
}

export function useAsignarOcupante(unidadId: Ref<number>) {
  const invalidar = useInvalidarUnidades();

  return useMutation<Ocupante, ApiError, AsignarOcupante>({
    mutationFn: (datos) => unidadesService.asignarOcupante(unidadId.value, datos),
    onSuccess: invalidar,
  });
}

export function useFinalizarOcupante() {
  const invalidar = useInvalidarUnidades();

  return useMutation<Ocupante, ApiError, { ocupanteId: number; fechaFin: string }>({
    mutationFn: ({ ocupanteId, fechaFin }) =>
      unidadesService.finalizarOcupante(ocupanteId, fechaFin),
    onSuccess: invalidar,
  });
}

/** Alta o edición de un vehículo (con `id` edita). Refresca el detalle y la búsqueda por placa. */
export function useGuardarVehiculo(unidadId: Ref<number>) {
  const invalidar = useInvalidarUnidades();

  return useMutation<Vehiculo, ApiError, { id?: number; datos: GuardarVehiculo }>({
    mutationFn: ({ id, datos }) =>
      id === undefined
        ? unidadesService.crearVehiculo(unidadId.value, datos)
        : unidadesService.editarVehiculo(id, datos),
    onSuccess: invalidar,
  });
}

export function useGuardarMascota(unidadId: Ref<number>) {
  const invalidar = useInvalidarUnidades();

  return useMutation<Mascota, ApiError, { id?: number; datos: GuardarMascota }>({
    mutationFn: ({ id, datos }) =>
      id === undefined
        ? unidadesService.crearMascota(unidadId.value, datos)
        : unidadesService.editarMascota(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarRegistro() {
  const invalidar = useInvalidarUnidades();

  return useMutation<void, ApiError, { tipo: 'vehiculo' | 'mascota'; id: number }>({
    mutationFn: ({ tipo, id }) =>
      tipo === 'vehiculo'
        ? unidadesService.eliminarVehiculo(id)
        : unidadesService.eliminarMascota(id),
    onSuccess: invalidar,
  });
}
