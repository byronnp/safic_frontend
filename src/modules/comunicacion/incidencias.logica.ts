import { z } from 'zod';

import type { TonoEstado } from '@/components/EstadoBadge.vue';

import type {
  CategoriaIncidencia,
  ComentarioIncidencia,
  EstadoIncidencia,
  FilaTablero,
  NuevaIncidencia,
  PrioridadIncidencia,
} from './services/incidencias.service';

export const CATEGORIAS: { id: CategoriaIncidencia; etiqueta: string }[] = [
  { id: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { id: 'convivencia', etiqueta: 'Convivencia' },
  { id: 'seguridad', etiqueta: 'Seguridad' },
  { id: 'areas_verdes', etiqueta: 'Áreas verdes' },
  { id: 'otro', etiqueta: 'Otro' },
];

export const etiquetaCategoria = (c: CategoriaIncidencia): string =>
  CATEGORIAS.find((x) => x.id === c)?.etiqueta ?? c;

export const PRIORIDADES: { id: PrioridadIncidencia; etiqueta: string }[] = [
  { id: 'alta', etiqueta: 'Alta' },
  { id: 'media', etiqueta: 'Media' },
  { id: 'baja', etiqueta: 'Baja' },
];

export const etiquetaPrioridad = (p: PrioridadIncidencia): string =>
  PRIORIDADES.find((x) => x.id === p)?.etiqueta ?? p;

/** Las columnas del tablero, en orden. */
export const COLUMNAS: { estado: EstadoIncidencia; nombre: string }[] = [
  { estado: 'abierto', nombre: 'Abierto' },
  { estado: 'en_proceso', nombre: 'En proceso' },
  { estado: 'resuelto', nombre: 'Resuelto' },
  { estado: 'cerrado', nombre: 'Cerrado' },
];

export const etiquetaEstado = (e: EstadoIncidencia): string =>
  COLUMNAS.find((c) => c.estado === e)?.nombre ?? e;

/** El botón que avanza la incidencia según su estado, o null si ya no hay a dónde (queda esperando al residente o cerrada). */
export function accionAvanzar(e: EstadoIncidencia): {
  texto: string;
  siguiente: EstadoIncidencia | null;
} {
  switch (e) {
    case 'abierto':
      return { texto: 'Pasar a En proceso', siguiente: 'en_proceso' };
    case 'en_proceso':
      return { texto: 'Marcar resuelto', siguiente: 'resuelto' };
    case 'resuelto':
      return { texto: 'Esperando al residente', siguiente: null };
    default:
      return { texto: 'Cerrado', siguiente: null };
  }
}

/** Tono de la insignia del residente. */
export function insigniaEstado(e: EstadoIncidencia): { texto: string; tono: TonoEstado } {
  const mapa: Record<EstadoIncidencia, { texto: string; tono: TonoEstado }> = {
    abierto: { texto: 'Abierta', tono: 'alerta' },
    en_proceso: { texto: 'En proceso', tono: 'info' },
    resuelto: { texto: 'Resuelto', tono: 'exito' },
    cerrado: { texto: 'Cerrada', tono: 'neutro' },
  };
  return mapa[e];
}

/** Lo que el residente puede ver de los comentarios: nunca las notas internas (la API ya las omite; aquí se vuelve a asegurar). */
export const comentariosPublicos = (cs: ComentarioIncidencia[]): ComentarioIncidencia[] =>
  cs.filter((c) => !c.interna);

/** El último comentario de la administración visible al residente. */
export const ultimaRespuestaPublica = (cs: ComentarioIncidencia[]): string | null =>
  [...comentariosPublicos(cs)].reverse().find((c) => c.de_administracion)?.texto ?? null;

/** «hace 2 h», «hace 1 día», «hace 5 días». `ahora` en milisegundos. */
export function hace(iso: string, ahora: number): string {
  const min = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60_000));
  if (min < 60) return min <= 1 ? 'hace un momento' : `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

/** «6 h» / «45 min» / «—». */
export function textoTiempoPromedio(horas: number | null): string {
  if (horas === null) return '—';
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  return `${Number.isInteger(horas) ? horas : horas.toFixed(1).replace('.', ',')} h`;
}

export interface FormularioIncidencia {
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia | null;
  unidadId: number | null;
  fotos: File[];
}

export type ErroresIncidencia = Partial<
  Record<'titulo' | 'descripcion' | 'categoria' | 'fotos', string | undefined>
>;

export const incidenciaVacia = (): FormularioIncidencia => ({
  titulo: '',
  descripcion: '',
  categoria: null,
  unidadId: null,
  fotos: [],
});

export const MAX_FOTOS = 3;
export const MAX_FOTO = 5 * 1024 * 1024;

const esquema = z.object({
  titulo: z.string().trim().min(3, 'Escribe un título corto.').max(120, 'Máximo 120 letras.'),
  descripcion: z.string().trim().min(3, 'Cuéntanos qué pasa.').max(2000, 'Máximo 2000 caracteres.'),
});

export function validarIncidencia(f: FormularioIncidencia): ErroresIncidencia {
  const errores: ErroresIncidencia = {};
  const r = esquema.safeParse(f);
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0] as 'titulo' | 'descripcion';
      if (!errores[campo]) errores[campo] = p.message;
    }
  }
  if (f.categoria === null) errores.categoria = 'Elige una categoría.';
  if (f.fotos.length > MAX_FOTOS) errores.fotos = `Máximo ${MAX_FOTOS} fotos.`;
  else if (f.fotos.some((x) => !['image/jpeg', 'image/png'].includes(x.type)))
    errores.fotos = 'Las fotos deben ser JPG o PNG.';
  else if (f.fotos.some((x) => x.size > MAX_FOTO)) errores.fotos = 'Una foto pesa más de 5 MB.';
  return errores;
}

export function peticionIncidencia(f: FormularioIncidencia): NuevaIncidencia {
  return {
    titulo: f.titulo.trim(),
    descripcion: f.descripcion.trim(),
    categoria: f.categoria as CategoriaIncidencia,
    unidad_id: f.unidadId,
    fotos: f.fotos,
  };
}

/** Las columnas del tablero con sus tarjetas (las más recientes primero). */
export function armarTablero(
  filas: FilaTablero[],
): { estado: EstadoIncidencia; nombre: string; items: FilaTablero[] }[] {
  return COLUMNAS.map((c) => ({ ...c, items: filas.filter((f) => f.estado === c.estado) }));
}
