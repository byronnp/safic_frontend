import {
  entradaDeApp,
  MENU_APP_GUARDIA,
  MENU_APP_RESIDENTE,
  PERMISOS_APP_GUARDIA,
  PERMISOS_APP_RESIDENTE,
  PERMISOS_COMPARTIDOS_DE_APP,
  PERMISOS_NEUTROS_DE_APP,
} from './menu';

/**
 * Dónde empieza quien solo tiene permisos de app: el residente en su app y el guardia en la suya (no en la pantalla de la
 * administración, que para ellos está vacía). Se decide por **permisos**, no por el nombre del rol, así que vale igual para un rol
 * nuevo que cree el super admin (p. ej. un «conserje» con permisos de garita). Quien tiene además cualquier permiso de
 * administración (finanzas, unidades.editar…) entra por «inicio»; sin permisos de app tampoco hay app que ofrecer.
 */
export function appDelPerfil(permisos: readonly string[]): 'app-residente' | 'app-guardia' | null {
  const esDeApp = (p: string): boolean =>
    PERMISOS_APP_RESIDENTE.includes(p) ||
    PERMISOS_APP_GUARDIA.includes(p) ||
    PERMISOS_NEUTROS_DE_APP.includes(p);

  if (permisos.length === 0 || !permisos.every(esDeApp)) return null;
  if (permisos.some((p) => PERMISOS_APP_GUARDIA.includes(p))) return 'app-guardia';
  if (permisos.some((p) => PERMISOS_APP_RESIDENTE.includes(p))) return 'app-residente';
  return null;
}

export type ClaveApp = 'residente' | 'guardia';

export interface AppDisponible {
  clave: ClaveApp;
  etiqueta: string;
  /** Ruta de entrada de la app (elige su primera pestaña permitida). */
  ruta: 'app-residente' | 'app-guardia';
}

/**
 * Las apps a las que puede entrar el perfil con sus permisos, para ofrecérselas en su menú. Un permiso compartido (incidencias) no
 * basta para ofrecer la app del residente a un guardia, pero sí a un rol que no tiene otra cosa.
 */
export function appsDisponibles(permisos: readonly string[]): AppDisponible[] {
  const apps: AppDisponible[] = [];
  const esDeGuardia = permisos.some((p) => PERMISOS_APP_GUARDIA.includes(p));
  const esDeResidente = permisos.some(
    (p) =>
      PERMISOS_APP_RESIDENTE.includes(p) &&
      (!PERMISOS_COMPARTIDOS_DE_APP.includes(p) || !esDeGuardia),
  );
  if (esDeResidente && entradaDeApp(MENU_APP_RESIDENTE, permisos) !== 'sin-permiso') {
    apps.push({ clave: 'residente', etiqueta: 'App del residente', ruta: 'app-residente' });
  }
  if (esDeGuardia && entradaDeApp(MENU_APP_GUARDIA, permisos) !== 'sin-permiso') {
    apps.push({ clave: 'guardia', etiqueta: 'App del guardia', ruta: 'app-guardia' });
  }
  return apps;
}

export interface OpcionesDeCuentaApp {
  /** Tiene más de un condominio activo. */
  cambiarCondominio: boolean;
  /** Tiene también permisos de administración: puede ir a la pantalla de la administración. */
  administracion: boolean;
  /** La otra app a la que puede entrar (la que no está usando). */
  otrasApps: AppDisponible[];
}

/**
 * Qué ofrece el menú de cuenta dentro de una app. Cerrar sesión siempre está. Lo demás depende de los permisos: así quien tiene
 * administración y app a la vez (o un rol nuevo mixto) puede pasar de una a otra sin teclear direcciones.
 */
export function opcionesDeCuentaApp(
  permisos: readonly string[],
  condominios: number,
  appActual: ClaveApp,
): OpcionesDeCuentaApp {
  return {
    cambiarCondominio: condominios > 1,
    administracion: permisos.length > 0 && appDelPerfil(permisos) === null,
    otrasApps: appsDisponibles(permisos).filter((a) => a.clave !== appActual),
  };
}
