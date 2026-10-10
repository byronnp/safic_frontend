import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';

import {
  MENU_BASE,
  MENU_PLATAFORMA,
  permisoDeRuta,
  puedeVerVistaPrevia,
  ROL_ACCESO_TOTAL_CONDOMINIO,
  ROL_ACCESO_TOTAL_PLATAFORMA,
} from '@/core/navigation/menu';

/** Lo mínimo de la sesión que necesita la guarda (facilita las pruebas). */
export interface SesionParaGuarda {
  autenticado: boolean;
  condominioId: number | null;
  /** Condominios con membresía activa (solo importa cuántos hay). */
  condominios: readonly unknown[];
  /** Tiene un rol de plataforma (super admin, soporte, cobranza…). */
  esPlataforma: boolean;
  /** Es contador en el condominio activo y aún no activó la verificación en dos pasos. */
  dobleFactorPendiente: boolean;
  /** Roles en el condominio activo y en la plataforma (para las vistas previas). */
  roles: readonly string[];
  rolesPlataforma: readonly string[];
  restaurar: () => Promise<void>;
  tienePermiso: (permiso: string) => boolean;
  tienePermisoPlataforma: (permiso: string) => boolean;
}

/**
 * Pantalla de entrada según el perfil cuando no hay condominio elegido:
 * el equipo de la plataforma sin condominios va a su panel; el resto, al selector.
 */
export function destinoSinCondominio(
  sesion: Pick<SesionParaGuarda, 'condominios' | 'esPlataforma'>,
): RouteLocationRaw {
  return sesion.esPlataforma && sesion.condominios.length === 0
    ? { name: 'plataforma' }
    : { name: 'seleccionar-condominio' };
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
 * 4. Panel de plataforma: exige un rol de plataforma y sus permisos (no los del condominio).
 * 5. Sin condominio elegido → selector de condominio (o el panel de plataforma
 *    si el usuario es solo de la plataforma).
 * 6. Contador sin verificación en dos pasos: solo puede configurarla.
 * 7. Sin el permiso de la ruta → página "sin permiso".
 *    Las pantallas en vista previa solo se abren en desarrollo y para el perfil
 *    que las vería (el permiso de su ítem de menú o acceso total), igual que el menú.
 */
export async function guardaDeSesion(
  destino: RouteLocationNormalized,
  sesion: SesionParaGuarda,
  opciones: OpcionesGuarda = {},
): Promise<true | RouteLocationRaw> {
  await sesion.restaurar();

  if (destino.meta.publica) {
    if (destino.name === 'login' && sesion.autenticado) {
      return sesion.condominioId ? { name: 'inicio' } : destinoSinCondominio(sesion);
    }
    return true;
  }

  if (!sesion.autenticado) {
    return destino.fullPath === '/'
      ? { name: 'login' }
      : { name: 'login', query: { redirect: destino.fullPath } };
  }

  if (destino.meta.plataforma) {
    if (!sesion.esPlataforma) {
      return sesion.condominioId ? { name: 'sin-permiso' } : destinoSinCondominio(sesion);
    }
    if (destino.name === 'plataforma-sin-permiso') {
      return true;
    }
    if (destino.meta.vistaPrevia) {
      const permiso = destino.meta.permiso ?? permisoDeRuta(MENU_PLATAFORMA, String(destino.name));
      const acceso = {
        accesoTotal: sesion.rolesPlataforma.includes(ROL_ACCESO_TOTAL_PLATAFORMA),
        tienePermiso: (p: string) => sesion.tienePermisoPlataforma(p),
      };
      return opciones.vistasPrevias && puedeVerVistaPrevia(permiso, acceso)
        ? true
        : { name: 'plataforma-sin-permiso' };
    }
    return !destino.meta.permiso || sesion.tienePermisoPlataforma(destino.meta.permiso)
      ? true
      : { name: 'plataforma-sin-permiso' };
  }

  // Solo de plataforma y sin condominios: el selector no tiene nada que mostrarle.
  const soloPlataforma = sesion.esPlataforma && sesion.condominios.length === 0;

  if (destino.name === 'seleccionar-condominio' && soloPlataforma) {
    return { name: 'plataforma' };
  }

  if (!destino.meta.sinCondominio && sesion.condominioId === null) {
    return soloPlataforma
      ? { name: 'plataforma' }
      : { name: 'seleccionar-condominio', query: { redirect: destino.fullPath } };
  }

  // La API no deja trabajar al contador sin verificación: se lleva a configurarla
  // (el selector también se permite: puede tener otro condominio donde no esté pendiente)
  if (
    sesion.dobleFactorPendiente &&
    destino.name !== 'doble-factor' &&
    destino.name !== 'seleccionar-condominio'
  ) {
    return { name: 'doble-factor', query: { redirect: destino.fullPath } };
  }

  if (destino.meta.vistaPrevia) {
    const permiso = destino.meta.permiso ?? permisoDeRuta(MENU_BASE, String(destino.name));
    const acceso = {
      accesoTotal: sesion.roles.includes(ROL_ACCESO_TOTAL_CONDOMINIO),
      tienePermiso: (p: string) => sesion.tienePermiso(p),
    };
    return opciones.vistasPrevias && puedeVerVistaPrevia(permiso, acceso)
      ? true
      : { name: 'sin-permiso' };
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
