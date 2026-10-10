import { useMutation } from '@tanstack/vue-query';

import type { ApiError } from '@/core/api/errors';
import {
  dobleFactorService,
  type CodigosRespaldo,
  type PreparacionDobleFactor,
} from '@/core/auth/doble-factor.service';
import { useSessionStore } from '@/stores/session';

/*
 * Todas con `gcTime: 0`: la contraseña, el secreto y los códigos de respaldo no deben quedar en la
 * caché de mutaciones al salir de la pantalla.
 */

/** Empieza a activar: contraseña → secreto y dirección para el QR. */
export function usePrepararDobleFactor() {
  return useMutation<PreparacionDobleFactor, ApiError, string>({
    mutationFn: (password) => dobleFactorService.preparar(password),
    gcTime: 0,
  });
}

/** Termina de activar con un código de la app; la sesión refleja que ya está activa. */
export function useConfirmarDobleFactor() {
  const session = useSessionStore();

  return useMutation<CodigosRespaldo, ApiError, string>({
    mutationFn: (codigo) => dobleFactorService.confirmar(codigo),
    gcTime: 0,
    onSuccess: () => session.aplicarDobleFactor(true),
  });
}

export function useRegenerarCodigosRespaldo() {
  return useMutation<CodigosRespaldo, ApiError, { password: string; codigo: string }>({
    mutationFn: ({ password, codigo }) => dobleFactorService.regenerarCodigos(password, codigo),
    gcTime: 0,
  });
}

export function useDesactivarDobleFactor() {
  const session = useSessionStore();

  return useMutation<void, ApiError, { password: string; codigo: string }>({
    mutationFn: ({ password, codigo }) => dobleFactorService.desactivar(password, codigo),
    gcTime: 0,
    onSuccess: () => session.aplicarDobleFactor(false),
  });
}
