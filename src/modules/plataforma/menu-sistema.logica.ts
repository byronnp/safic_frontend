import { z } from 'zod';

import type {
  AmbitoMenu,
  CambiosMenuItem,
  MenuSistemaItem,
  NuevoMenuItem,
} from './services/menu-sistema.service';

export const AMBITOS_MENU: { valor: AmbitoMenu; etiqueta: string }[] = [
  { valor: 'condominio', etiqueta: 'Condominio (web)' },
  { valor: 'plataforma', etiqueta: 'Plataforma' },
];

/** Íconos que ofrece el editor (Material Symbols Rounded, con prefijo). */
export const ICONOS_MENU = [
  'home',
  'apartment',
  'group',
  'dashboard',
  'fact_check',
  'request_quote',
  'account_balance',
  'bar_chart',
  'event_available',
  'badge',
  'how_to_vote',
  'pool',
  'manage_accounts',
  'card_membership',
  'campaign',
  'report',
  'inventory_2',
  'savings',
  'storefront',
  'receipt_long',
  'tune',
  'settings',
  'domain',
  'shield_person',
  'gavel',
  'lock',
  'category',
  'location_city',
].map((n) => `sym_r_${n}`);

/** Íconos del editor; si el ítem usa otro (p. ej. `sym_r_lock` de un seeder) también se ofrece. */
export function iconosOfrecidos(actual: string): string[] {
  return actual === '' || ICONOS_MENU.includes(actual) ? ICONOS_MENU : [actual, ...ICONOS_MENU];
}

/** Formulario del editor: lo que la persona ve y cambia de un ítem. */
export interface BorradorMenu {
  etiqueta: string;
  icono: string;
  ruta: string;
  permiso: string;
  activo: boolean;
  roles: string[];
  /** Solo al crear. */
  padreId: number | null;
  esGrupo: boolean;
}

export function borradorNuevo(esGrupo: boolean): BorradorMenu {
  return {
    etiqueta: '',
    icono: 'sym_r_dashboard',
    ruta: '',
    permiso: '',
    activo: true,
    roles: [],
    padreId: null,
    esGrupo,
  };
}

export function borradorDe(item: MenuSistemaItem): BorradorMenu {
  return {
    etiqueta: item.etiqueta,
    icono: item.icono,
    ruta: item.ruta ?? '',
    permiso: item.permiso ?? '',
    activo: item.activo,
    roles: [...item.roles],
    padreId: item.padre_id,
    esGrupo: item.es_grupo,
  };
}

const esquemaBorrador = z.object({
  etiqueta: z
    .string()
    .trim()
    .min(2, 'Escribe la etiqueta (mínimo 2 letras).')
    .max(60, 'La etiqueta tiene máximo 60 caracteres.'),
  icono: z.string().min(1, 'Elige un ícono.'),
});

/** Errores por campo del formulario; vacío si todo está bien. */
export function validarBorrador(
  b: BorradorMenu,
): Partial<Record<'etiqueta' | 'icono' | 'ruta', string>> {
  const errores: Partial<Record<'etiqueta' | 'icono' | 'ruta', string>> = {};
  const r = esquemaBorrador.safeParse(b);
  if (!r.success) {
    for (const e of r.error.issues) {
      const campo = e.path[0];
      if ((campo === 'etiqueta' || campo === 'icono') && !errores[campo])
        errores[campo] = e.message;
    }
  }
  if (!b.esGrupo && b.ruta === '') errores.ruta = 'Elige la pantalla.';
  return errores;
}

function mismosPerfiles(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
}

/** Solo lo que cambió respecto al ítem guardado (PATCH). `activo` no va: se cambia con el interruptor de la lista. */
export function cambiosDe(item: MenuSistemaItem, b: BorradorMenu): CambiosMenuItem {
  const c: CambiosMenuItem = {};
  if (b.etiqueta.trim() !== item.etiqueta) c.etiqueta = b.etiqueta.trim();
  if (b.icono !== item.icono) c.icono = b.icono;
  if (!item.es_grupo) {
    if (b.ruta !== (item.ruta ?? '')) c.ruta = b.ruta;
    if (b.permiso !== (item.permiso ?? '')) c.permiso = b.permiso === '' ? null : b.permiso;
    if (!mismosPerfiles(b.roles, item.roles)) c.roles = b.roles;
  }
  return c;
}

export function peticionNueva(ambito: AmbitoMenu, b: BorradorMenu): NuevoMenuItem {
  return {
    ambito,
    etiqueta: b.etiqueta.trim(),
    icono: b.icono,
    activo: b.activo,
    ...(b.esGrupo
      ? { seccion: true }
      : {
          padre_id: b.padreId,
          ruta: b.ruta,
          permiso: b.permiso === '' ? null : b.permiso,
          roles: b.roles,
        }),
  };
}

export interface RutaConocida {
  name: string;
  titulo: string;
  publica: boolean;
  app: boolean;
  /** Tiene parámetros (`:id`): no sirve como pantalla del menú. */
  conParametros: boolean;
  /** Pantalla de diseño sin API: todavía no es una pantalla real del menú. */
  previa: boolean;
}

/**
 * Pantallas que se pueden poner en el menú: rutas con nombre del router del ámbito.
 * La del propio ítem que se edita siempre se ofrece.
 */
export function pantallasDisponibles(
  rutas: readonly RutaConocida[],
  ambito: AmbitoMenu,
  actual = '',
): { ruta: string; titulo: string }[] {
  const salida = rutas
    .filter(
      (r) =>
        r.name !== '' &&
        r.titulo !== '' &&
        !r.publica &&
        !r.app &&
        !r.conParametros &&
        !r.previa &&
        /^[a-z0-9-]+$/.test(r.name) &&
        r.name.startsWith('plataforma') === (ambito === 'plataforma') &&
        r.name !== 'plataforma' &&
        r.name !== 'plataforma-sin-permiso',
    )
    .map((r) => ({ ruta: r.name, titulo: r.titulo }))
    .sort((a, b) => a.ruta.localeCompare(b.ruta));

  if (actual !== '' && !salida.some((p) => p.ruta === actual)) {
    salida.unshift({ ruta: actual, titulo: actual });
  }
  return salida;
}

/** Subir o bajar se ofrece solo si hay un hermano en esa dirección. */
export function puedeMover(
  items: readonly MenuSistemaItem[],
  item: MenuSistemaItem,
  direccion: 'arriba' | 'abajo',
): boolean {
  const hermanos = items
    .filter((i) => i.padre_id === item.padre_id)
    .sort((a, b) => a.orden - b.orden || a.id - b.id);
  const pos = hermanos.findIndex((i) => i.id === item.id);
  return direccion === 'arriba' ? pos > 0 : pos >= 0 && pos < hermanos.length - 1;
}

/** Nombre del grupo de un ítem (para la lista). */
export function grupoDe(items: readonly MenuSistemaItem[], item: MenuSistemaItem): string {
  return items.find((i) => i.id === item.padre_id)?.etiqueta ?? '';
}

/** ¿El formulario de un ítem nuevo ya tiene algo escrito? */
export function nuevoModificado(b: BorradorMenu): boolean {
  return JSON.stringify(b) !== JSON.stringify(borradorNuevo(b.esGrupo));
}
