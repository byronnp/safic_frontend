import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  catalogosService,
  type CatalogosAlta,
  type Plan,
  type Provincia,
} from '../services/catalogos.service';

/**
 * Claves de caché de los catálogos de plataforma. No llevan condominio: son
 * datos globales del panel del super admin (la caché se vacía al cerrar sesión).
 */
export const clavesCatalogos = {
  planes: ['plataforma', 'planes'] as const,
  catalogos: ['plataforma', 'catalogos'] as const,
  ubicaciones: ['plataforma', 'ubicaciones'] as const,
};

/** Permiso que exigen /plataforma/planes, /catalogos y /ubicaciones (x-permiso del contrato). */
export const PERMISO = 'plataforma.condominios';

/** Los catálogos cambian poco: se reutilizan durante 30 minutos. */
const VIGENCIA = 30 * 60_000;

export function usePlanes() {
  const session = useSessionStore();
  return useQuery<Plan[], ApiError>({
    queryKey: clavesCatalogos.planes,
    queryFn: () => catalogosService.planes(),
    enabled: computed(() => session.tienePermisoPlataforma(PERMISO)),
    staleTime: VIGENCIA,
  });
}

export function useCatalogos() {
  const session = useSessionStore();
  return useQuery<CatalogosAlta, ApiError>({
    queryKey: clavesCatalogos.catalogos,
    queryFn: () => catalogosService.catalogos(),
    enabled: computed(() => session.tienePermisoPlataforma(PERMISO)),
    staleTime: VIGENCIA,
  });
}

export function useUbicaciones() {
  const session = useSessionStore();
  return useQuery<Provincia[], ApiError>({
    queryKey: clavesCatalogos.ubicaciones,
    queryFn: () => catalogosService.ubicaciones(),
    enabled: computed(() => session.tienePermisoPlataforma(PERMISO)),
    staleTime: VIGENCIA,
  });
}
