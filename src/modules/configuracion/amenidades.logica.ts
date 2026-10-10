import { formatoFechaCorta } from '@/utils/formato';

import type {
  AgregarAmenidad,
  AmenidadCondominio,
  CategoriaAmenidad,
  OrigenAmenidad,
  TipoCatalogo,
} from './services/amenidades.service';

export const CATEGORIAS: { valor: CategoriaAmenidad; etiqueta: string }[] = [
  { valor: 'recreacion', etiqueta: 'Recreación' },
  { valor: 'deporte', etiqueta: 'Deporte' },
  { valor: 'social', etiqueta: 'Social' },
  { valor: 'servicios', etiqueta: 'Servicios' },
  { valor: 'seguridad', etiqueta: 'Seguridad' },
];

/** Color del ícono de cada categoría (mockup F1AmenidadesCondominio). */
export const COLOR_CATEGORIA: Record<CategoriaAmenidad, string> = {
  recreacion: '#0E5E5B',
  deporte: '#23407A',
  social: '#B8641C',
  servicios: '#5F5B52',
  seguridad: '#7A2E5A',
};

export const COLOR_SIN_CATEGORIA = '#5F5B52';

export function colorAmenidad(a: Pick<AmenidadCondominio, 'categoria'>): string {
  return a.categoria ? COLOR_CATEGORIA[a.categoria] : COLOR_SIN_CATEGORIA;
}

export function usoAmenidad(a: AmenidadCondominio): string {
  if (a.esencial) {
    return 'Esencial · no se restringe';
  }
  return a.reservable ? 'Reservable' : 'Uso libre';
}

export function estadoAmenidad(a: AmenidadCondominio): string {
  switch (a.estado) {
    case 'mantenimiento':
      return a.mantenimiento_hasta
        ? `Mantenimiento hasta ${formatoFechaCorta(a.mantenimiento_hasta)}`
        : 'Mantenimiento';
    case 'inactiva':
      return 'Inactiva';
    default:
      return 'Disponible';
  }
}

export function tonoEstadoAmenidad(a: AmenidadCondominio): 'exito' | 'alerta' | 'neutro' {
  return a.estado === 'mantenimiento' ? 'alerta' : a.estado === 'inactiva' ? 'neutro' : 'exito';
}

/** "Área BBQ 1" → "ÁB1"... como el mockup: palabras de más de 2 letras o con dígitos, máx. 2. */
export function inicialesAmenidad(nombre: string): string {
  return nombre
    .replace(/\(.*\)/, '')
    .split(' ')
    .filter((w) => w.length > 2 || /\d/.test(w))
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('')
    .slice(0, 2);
}

/** "Capacidad 30 · reservas de 3 h · con aprobación" con lo que se sabe de la amenidad. */
export function detalleAmenidad(a: AmenidadCondominio): string {
  const partes: string[] = [];
  if (a.capacidad !== null) {
    partes.push(`Capacidad ${a.capacidad}`);
  }
  if (a.duracion_maxima_min !== null) {
    const horas = a.duracion_maxima_min / 60;
    partes.push(`reservas de ${String(horas).replace('.', ',')} h`);
  }
  if (a.requiere_aprobacion) {
    partes.push('con aprobación');
  }
  if (a.cantidad > 1) {
    partes.push(`cantidad ${a.cantidad} · un solo registro`);
  }
  if (partes.length === 0) {
    partes.push(a.reservable ? 'Se reserva' : 'Uso libre');
  }
  return partes.join(' · ');
}

export function kpisAmenidades(lista: AmenidadCondominio[]): { l: string; v: number }[] {
  const activas = lista.filter((a) => a.estado !== 'inactiva');
  return [
    { l: 'Amenidades', v: activas.length },
    { l: 'Reservables', v: activas.filter((a) => a.reservable).length },
    { l: 'En mantenimiento', v: activas.filter((a) => a.estado === 'mantenimiento').length },
    { l: 'Propias', v: activas.filter((a) => a.origen === 'propia').length },
  ];
}

// ---------- Agregar ----------

export interface FormularioAmenidad {
  origen: OrigenAmenidad;
  tipoId: number | null;
  nombre: string;
  categoria: CategoriaAmenidad;
  reservable: boolean;
  cantidad: number;
  ubicacion: string;
}

export const FORMULARIO_AMENIDAD_VACIO: FormularioAmenidad = {
  origen: 'catalogo',
  tipoId: null,
  nombre: '',
  categoria: 'recreacion',
  reservable: true,
  cantidad: 1,
  ubicacion: 'Área social',
};

/**
 * Los nombres que se crearían, con las mismas reglas del servidor: una reservable con varias
 * unidades son registros separados numerados (la numeración sigue donde iba); una que no se
 * reserva es un solo registro con su cantidad.
 */
export function nombresPrevistos(
  f: FormularioAmenidad,
  catalogo: TipoCatalogo[],
  existentes: AmenidadCondominio[],
): string[] {
  const tipo = f.origen === 'catalogo' ? (catalogo.find((t) => t.id === f.tipoId) ?? null) : null;
  const base = f.origen === 'catalogo' ? (tipo?.nombre ?? '') : f.nombre.trim();
  if (base === '') {
    return [];
  }

  const reservable = f.origen === 'catalogo' ? !!tipo?.reservable : f.reservable;
  const usados = tipo ? existentes.filter((a) => a.tipo === tipo.nombre).length : 0;

  if (reservable && f.cantidad > 1) {
    return Array.from({ length: f.cantidad }, (_, k) => `${base} ${usados + k + 1}`);
  }
  if (reservable && tipo && usados > 0) {
    return [`${base} ${usados + 1}`];
  }
  return [f.cantidad > 1 ? `${base} (${f.cantidad})` : base];
}

export interface VistaAmenidad {
  tono: 'neutro' | 'error' | 'info' | 'exito';
  texto: string;
  valido: boolean;
  nombres: string[];
}

/** Lo que se le dice a la persona antes de agregar, y si se puede agregar. */
export function vistaAmenidad(
  f: FormularioAmenidad,
  catalogo: TipoCatalogo[],
  existentes: AmenidadCondominio[],
): VistaAmenidad {
  const nombres = nombresPrevistos(f, catalogo, existentes);
  const tipo = f.origen === 'catalogo' ? (catalogo.find((t) => t.id === f.tipoId) ?? null) : null;
  const reservable = f.origen === 'catalogo' ? !!tipo?.reservable : f.reservable;

  if (nombres.length === 0) {
    return {
      tono: 'neutro',
      valido: false,
      nombres,
      texto:
        f.origen === 'catalogo'
          ? 'Elige un tipo del catálogo.'
          : 'Escribe el nombre de la amenidad.',
    };
  }

  const nombreBase = f.nombre.trim();
  if (
    f.origen === 'propia' &&
    catalogo.some((t) => t.nombre.toLowerCase() === nombreBase.toLowerCase())
  ) {
    return {
      tono: 'error',
      valido: false,
      nombres,
      texto: `"${nombreBase}" ya existe en el catálogo. Agrégala desde «Del catálogo» para mantener los valores sugeridos.`,
    };
  }

  const repetidos = nombres.filter((n) =>
    existentes.some((a) => a.nombre.toLowerCase() === n.toLowerCase()),
  );
  if (repetidos.length > 0) {
    return {
      tono: 'error',
      valido: false,
      nombres,
      texto: `Ya hay una amenidad con ese nombre: ${repetidos.join(', ')}.`,
    };
  }

  if (reservable && f.cantidad > 1) {
    return {
      tono: 'info',
      valido: true,
      nombres,
      texto: `Se crearán ${f.cantidad} registros para reservarlos por separado: ${nombres.join(', ')}.`,
    };
  }
  return {
    tono: 'exito',
    valido: true,
    nombres,
    texto: `Se creará: ${nombres[0]}${reservable ? '. Después configura horarios y cobro en Áreas comunes.' : '.'}${f.origen === 'propia' ? ' Solo tu condominio la verá.' : ''}`,
  };
}

export function peticionAmenidad(f: FormularioAmenidad): AgregarAmenidad {
  const ubicacion = f.ubicacion.trim() === '' ? null : f.ubicacion.trim();
  return f.origen === 'catalogo'
    ? { origen: 'catalogo', amenidad_catalogo_id: f.tipoId!, cantidad: f.cantidad, ubicacion }
    : {
        origen: 'propia',
        nombre: f.nombre.trim(),
        categoria: f.categoria,
        reservable: f.reservable,
        cantidad: f.cantidad,
        ubicacion,
      };
}

export const CAMPOS_API_AMENIDAD: Record<string, keyof FormularioAmenidad> = {
  amenidad_catalogo_id: 'tipoId',
  nombre: 'nombre',
  categoria: 'categoria',
  cantidad: 'cantidad',
  ubicacion: 'ubicacion',
};

export const UBICACION_MAXIMO = 80;

/** Error de la ubicación escrita, o null si es válida (vacía está bien: se quita la ubicación). */
export function errorUbicacion(texto: string): string | null {
  return texto.trim().length > UBICACION_MAXIMO
    ? `La ubicación tiene máximo ${UBICACION_MAXIMO} caracteres.`
    : null;
}

/** Lo que viaja a la API: vacío quita la ubicación. */
export function ubicacionParaGuardar(texto: string): string | null {
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/** Ubicaciones sugeridas: el área social y cada bloque del condominio. */
export function ubicacionesSugeridas(bloques: string[]): string[] {
  return ['Área social', ...bloques];
}
