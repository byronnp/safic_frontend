import { z } from 'zod';

import type { PermisoAdmin, RolAdmin, TipoRolAdmin } from './services/roles-admin.service';

/**
 * Borrador de un rol: los permisos que se ven (`permisos`) y los que tenía al empezar a
 * editar (`base`), para guardar solo lo que la persona cambió y no pisar cambios ajenos.
 */
export interface BorradorRol {
  base: string[];
  permisos: string[];
}

/** Clave del rol → borrador. Solo están los roles tocados. */
export type Borradores = Record<string, BorradorRol>;

export const TIPO_TEXTO: Record<TipoRolAdmin, string> = {
  sistema: 'Sistema',
  cargo: 'Cargo',
  adicional: 'Adicional',
};

/** Clase visual del tipo (sis, car, adi) del mockup. */
export const TIPO_CLASE: Record<TipoRolAdmin, string> = {
  sistema: 'sis',
  cargo: 'car',
  adicional: 'adi',
};

const esquemaNombre = z
  .string()
  .trim()
  .min(3, 'El nombre tiene mínimo 3 caracteres.')
  .max(60, 'El nombre tiene máximo 60 caracteres.');

/** Mensaje de error del nombre de un rol nuevo, o null si es válido. */
export function errorNombreRol(nombre: string): string | null {
  const r = esquemaNombre.safeParse(nombre);
  return r.success ? null : (r.error.issues[0]?.message ?? 'Nombre no válido.');
}

/** Permisos vigentes del rol: el borrador si lo hay, si no los guardados. */
export function permisosVigentes(rol: RolAdmin, borradores: Borradores): readonly string[] {
  return borradores[rol.clave]?.permisos ?? rol.permisos;
}

export function concedido(rol: RolAdmin, permiso: string, borradores: Borradores): boolean {
  return !rol.bloqueos[permiso] && permisosVigentes(rol, borradores).includes(permiso);
}

/** Motivo por el que la casilla no se puede cambiar, o '' si se puede. */
export function motivoFijo(rol: RolAdmin, permiso: string, borradores: Borradores): string {
  const bloqueo = rol.bloqueos[permiso];
  if (bloqueo) return bloqueo;
  if (rol.obligatorios.includes(permiso) && concedido(rol, permiso, borradores)) {
    return 'Este rol necesita este permiso.';
  }
  return '';
}

function mismos(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
}

/** Devuelve los borradores con la casilla invertida; se descarta el borrador si vuelve a lo guardado. */
export function alternarPermiso(
  rol: RolAdmin,
  permiso: string,
  borradores: Borradores,
): Borradores {
  if (motivoFijo(rol, permiso, borradores) !== '') return borradores;
  const actuales = permisosVigentes(rol, borradores);
  const nuevos = actuales.includes(permiso)
    ? actuales.filter((p) => p !== permiso)
    : [...actuales, permiso];
  const base = borradores[rol.clave]?.base ?? rol.permisos;
  const { [rol.clave]: _descartado, ...resto } = borradores;
  void _descartado;
  return mismos(nuevos, rol.permisos)
    ? resto
    : { ...resto, [rol.clave]: { base, permisos: nuevos } };
}

/**
 * Conjunto final a enviar: lo que hoy tiene el rol en el servidor, más lo que se agregó y
 * menos lo que se quitó respecto a cuando se empezó a editar.
 */
export function permisosFinales(rol: RolAdmin, borrador: BorradorRol): string[] {
  const agregados = borrador.permisos.filter((p) => !borrador.base.includes(p));
  const quitados = borrador.base.filter((p) => !borrador.permisos.includes(p));
  return [...new Set([...rol.permisos, ...agregados])].filter((p) => !quitados.includes(p));
}

/** Quita los borradores que ya coinciden con lo guardado (p. ej. otro admin hizo el mismo cambio). */
export function sinBorradoresResueltos(
  roles: readonly RolAdmin[],
  borradores: Borradores,
): Borradores {
  const resultado: Borradores = {};
  for (const [clave, borrador] of Object.entries(borradores)) {
    const rol = roles.find((r) => r.clave === clave);
    if (rol && !mismos(borrador.permisos, rol.permisos)) resultado[clave] = borrador;
  }
  return resultado;
}

/** Roles con cambios sin guardar, en el orden de la matriz. */
export function rolesModificados(roles: readonly RolAdmin[], borradores: Borradores): RolAdmin[] {
  return roles.filter((r) => borradores[r.clave] !== undefined);
}

/** Cuántos permisos tiene y si alguno cuenta para el límite de usuarios del plan (ADM). */
export function resumenRol(
  rol: RolAdmin,
  permisos: readonly PermisoAdmin[],
  borradores: Borradores,
): { total: number; administrativo: boolean } {
  const dados = permisos.filter((p) => concedido(rol, p.clave, borradores));
  return { total: dados.length, administrativo: dados.some((p) => p.administrativo) };
}

export function textoAlcance(rol: RolAdmin): string {
  if (rol.condominios === 0) return 'Sin uso';
  return rol.condominios === 1 ? '1 condominio' : `${rol.condominios} condominios`;
}

/** Permisos agrupados por módulo, respetando el filtro y el orden de aparición. */
export function gruposDePermisos(
  permisos: readonly PermisoAdmin[],
  modulo: string,
): { modulo: string; permisos: PermisoAdmin[] }[] {
  const lista: { modulo: string; permisos: PermisoAdmin[] }[] = [];
  for (const p of permisos) {
    if (modulo !== 'todos' && p.grupo !== modulo) continue;
    let grupo = lista.find((g) => g.modulo === p.grupo);
    if (!grupo) {
      grupo = { modulo: p.grupo, permisos: [] };
      lista.push(grupo);
    }
    grupo.permisos.push(p);
  }
  return lista;
}
