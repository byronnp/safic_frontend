import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiError } from '@/core/api/errors';
import { MOSTRAR_VISTAS_PREVIAS } from '@/core/vista-previa';
import { useSessionStore } from '@/stores/session';

import {
  combinarConVistasPrevias,
  MENU_BASE,
  MENU_PLATAFORMA,
  normalizarMenu,
  type ItemMenu,
} from './menu';
import { menuService } from './menu.service';

/** Claves de caché del menú: el del condominio incluye el condominio activo. */
export const clavesMenu = {
  condominio: (condominioId: number | null) => ['menu', 'condominio', condominioId] as const,
  plataforma: (usuarioId: number | null) => ['menu', 'plataforma', usuarioId] as const,
};

/**
 * Menú del perfil en el condominio activo. En desarrollo se le suman las
 * pantallas en vista previa del menú local (MENU_BASE).
 */
export function useMenuCondominio() {
  const session = useSessionStore();
  const router = useRouter();

  const consulta = useQuery<ItemMenu[], ApiError>({
    queryKey: computed(() => clavesMenu.condominio(session.condominioId)),
    // El condominio sale de la clave: la respuesta nunca queda bajo otro condominio.
    queryFn: ({ queryKey }) => menuService.condominio(Number(queryKey[2])),
    enabled: computed(() => session.condominioId !== null),
    staleTime: 5 * 60_000,
  });

  const menu = computed(() => {
    const deApi = normalizarMenu(consulta.data.value ?? [], (ruta) => router.hasRoute(ruta));
    return MOSTRAR_VISTAS_PREVIAS ? combinarConVistasPrevias(deApi, MENU_BASE) : deApi;
  });

  return { ...consulta, menu };
}

/** Menú del panel de plataforma (perfil de plataforma del usuario). */
export function useMenuPlataforma() {
  const session = useSessionStore();
  const router = useRouter();

  const consulta = useQuery<ItemMenu[], ApiError>({
    queryKey: computed(() => clavesMenu.plataforma(session.usuario?.id ?? null)),
    queryFn: () => menuService.plataforma(),
    enabled: computed(() => session.esPlataforma),
    staleTime: 5 * 60_000,
  });

  const menu = computed(() => {
    const deApi = normalizarMenu(consulta.data.value ?? [], (ruta) => router.hasRoute(ruta));
    return MOSTRAR_VISTAS_PREVIAS ? combinarConVistasPrevias(deApi, MENU_PLATAFORMA) : deApi;
  });

  return { ...consulta, menu };
}
