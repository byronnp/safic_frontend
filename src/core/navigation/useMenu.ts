import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { MOSTRAR_VISTAS_PREVIAS } from '@/core/vista-previa';
import { useSessionStore } from '@/stores/session';

import { combinarConVistasPrevias, MENU_BASE, MENU_PLATAFORMA, type ItemMenu } from './menu';
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

  const consulta = useQuery<ItemMenu[], ApiError>({
    queryKey: computed(() => clavesMenu.condominio(session.condominioId)),
    queryFn: () => menuService.condominio(),
    enabled: computed(() => session.condominioId !== null),
    staleTime: 5 * 60_000,
  });

  const menu = computed(() =>
    MOSTRAR_VISTAS_PREVIAS
      ? combinarConVistasPrevias(consulta.data.value ?? [], MENU_BASE)
      : (consulta.data.value ?? []),
  );

  return { ...consulta, menu };
}

/** Menú del panel de plataforma (perfil de plataforma del usuario). */
export function useMenuPlataforma() {
  const session = useSessionStore();

  const consulta = useQuery<ItemMenu[], ApiError>({
    queryKey: computed(() => clavesMenu.plataforma(session.usuario?.id ?? null)),
    queryFn: () => menuService.plataforma(),
    enabled: computed(() => session.esPlataforma),
    staleTime: 5 * 60_000,
  });

  const menu = computed(() =>
    MOSTRAR_VISTAS_PREVIAS
      ? combinarConVistasPrevias(consulta.data.value ?? [], MENU_PLATAFORMA)
      : (consulta.data.value ?? []),
  );

  return { ...consulta, menu };
}
