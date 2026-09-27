import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';

/** Lo mínimo de la sesión que necesita la guarda (facilita las pruebas). */
export interface SesionParaGuarda {
  autenticado: boolean;
  condominioId: number | null;
  restaurar: () => Promise<void>;
  tienePermiso: (permiso: string) => boolean;
}

export interface OpcionesGuarda {
  /** Permite abrir pantallas en vista previa (solo desarrollo). */
  vistasPrevias?: boolean;
}

/**
 * Decide a dónde puede ir el usuario:
 * 1. Recupera la sesión con el refresh token la primera vez.
 * 2. Rutas públicas: libres (login redirige al inicio si ya hay sesión).
 * 3. Sin sesión → login (recordando a dónde iba).
 * 4. Sin condominio elegido → selector de condominio.
 * 5. Sin el permiso de la ruta → página "sin permiso".
 *    Las pantallas en vista previa no piden permiso (no muestran datos reales),
 *    pero solo se abren en desarrollo.
 */
export async function guardaDeSesion(
  destino: RouteLocationNormalized,
  sesion: SesionParaGuarda,
  opciones: OpcionesGuarda = {},
): Promise<true | RouteLocationRaw> {
  await sesion.restaurar();

  if (destino.meta.publica) {
    if (destino.name === 'login' && sesion.autenticado) {
      return sesion.condominioId ? { name: 'inicio' } : { name: 'seleccionar-condominio' };
    }
    return true;
  }

  if (!sesion.autenticado) {
    return destino.fullPath === '/'
      ? { name: 'login' }
      : { name: 'login', query: { redirect: destino.fullPath } };
  }

  if (!destino.meta.sinCondominio && sesion.condominioId === null) {
    return { name: 'seleccionar-condominio', query: { redirect: destino.fullPath } };
  }

  if (destino.meta.vistaPrevia) {
    return opciones.vistasPrevias ? true : { name: 'sin-permiso' };
  }

  if (destino.meta.permiso && !sesion.tienePermiso(destino.meta.permiso)) {
    return { name: 'sin-permiso' };
  }

  return true;
}

/** Solo acepta redirecciones internas (evita redirigir a otro sitio). */
export function redireccionSegura(valor: unknown): string | null {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//')
    ? valor
    : null;
}
