import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';

import {
  menuSistemaService,
  type AmbitoMenu,
  type CambiosMenuItem,
  type MenuSistema,
  type MenuSistemaItem,
  type MenuVistaPrevia,
  type NuevoMenuItem,
} from '../services/menu-sistema.service';

/** Datos del panel de plataforma: no dependen de un condominio (`['plataforma', …]`). */
export const clavesMenuSistema = {
  todas: ['plataforma', 'menu-sistema'] as const,
  menu: (ambito: AmbitoMenu) => ['plataforma', 'menu-sistema', 'menu', ambito] as const,
  previa: (ambito: AmbitoMenu, perfil: string) =>
    ['plataforma', 'menu-sistema', 'previa', ambito, perfil] as const,
  /** Para `useIsMutating`: cualquier cambio al menú en curso. */
  mutacion: ['plataforma', 'menu-sistema', 'cambio'] as const,
};

export function useMenuSistema(ambito: Ref<AmbitoMenu>) {
  return useQuery<MenuSistema, ApiError>({
    queryKey: () => clavesMenuSistema.menu(ambito.value),
    queryFn: () => menuSistemaService.listar(ambito.value),
    refetchOnWindowFocus: false,
  });
}

export function useVistaPreviaMenu(ambito: Ref<AmbitoMenu>, perfil: Ref<string>) {
  return useQuery<MenuVistaPrevia, ApiError>({
    queryKey: () => clavesMenuSistema.previa(ambito.value, perfil.value),
    queryFn: () => menuSistemaService.vistaPrevia(ambito.value, perfil.value),
    enabled: () => perfil.value !== '',
    refetchOnWindowFocus: false,
  });
}

/** Todo cambio altera el menú y su vista previa: se vuelven a pedir (también en error). */
function useMutacionMenu<TDatos, TVariables>(ejecutar: (variables: TVariables) => Promise<TDatos>) {
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables>({
    mutationKey: clavesMenuSistema.mutacion,
    mutationFn: ejecutar,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clavesMenuSistema.todas }),
  });
}

export function useCrearMenuItem() {
  return useMutacionMenu<MenuSistemaItem, NuevoMenuItem>((datos) =>
    menuSistemaService.crear(datos),
  );
}

export function useEditarMenuItem() {
  return useMutacionMenu<MenuSistemaItem, { id: number; cambios: CambiosMenuItem }>(
    ({ id, cambios }) => menuSistemaService.editar(id, cambios),
  );
}

export function useMoverMenuItem() {
  return useMutacionMenu<MenuSistemaItem[], { id: number; direccion: 'arriba' | 'abajo' }>(
    ({ id, direccion }) => menuSistemaService.mover(id, direccion),
  );
}
