import { ICONOS } from './icons';

/**
 * Ítem del menú lateral. Mismo formato que devolverá GET /me/menu (menú
 * administrable por el super admin). Mientras ese endpoint no exista, se usa
 * MENU_BASE filtrado por los permisos del condominio activo.
 */
export interface ItemMenu {
  id: string;
  etiqueta: string;
  /** Obligatorio: Material Symbols Rounded (sym_r_*). */
  icono: string;
  /** Nombre de la ruta de vue-router. Los grupos no tienen ruta. */
  ruta?: string;
  /** Permiso requerido; si falta, lo ve cualquier usuario con sesión. */
  permiso?: string;
  hijos?: ItemMenu[];
}

export const MENU_BASE: ItemMenu[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: ICONOS.inicio, ruta: 'inicio' },
  {
    id: 'unidades',
    etiqueta: 'Unidades',
    icono: ICONOS.unidades,
    hijos: [
      {
        id: 'unidades.bloques',
        etiqueta: 'Bloques',
        icono: ICONOS.bloques,
        ruta: 'bloques',
        permiso: 'unidades.ver',
      },
    ],
  },
];

/**
 * Deja solo los ítems permitidos. Un grupo sin hijos visibles desaparece.
 * Ocultar un ítem NO es seguridad: cada ruta de la API exige su permiso.
 */
export function filtrarMenu(items: ItemMenu[], permisos: readonly string[]): ItemMenu[] {
  const resultado: ItemMenu[] = [];

  for (const item of items) {
    if (item.permiso && !permisos.includes(item.permiso)) {
      continue;
    }

    if (item.hijos) {
      const hijos = filtrarMenu(item.hijos, permisos);
      if (hijos.length === 0) {
        continue;
      }
      resultado.push({ ...item, hijos });
      continue;
    }

    resultado.push(item);
  }

  return resultado;
}
